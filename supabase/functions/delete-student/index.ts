// ============================================
// delete-student — AVMS Admin
// Deletes a student completely:
//   1. Their uploaded files in membership-documents
//   2. Their membership_applications rows
//   3. Their cbt_attempts rows
//   4. Their students row
//   5. Their Supabase Auth user
// Requires the caller to be an authenticated admin.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // ---- Verify caller is an admin ----
        const authHeader = req.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) {
            return json({ error: 'Missing auth token' }, 401);
        }

        // Client with the caller's token — used to verify identity
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
        const { data: userData, error: userErr } = await userClient.auth.getUser();
        if (userErr || !userData?.user) {
            return json({ error: 'Invalid session' }, 401);
        }

        const callerRole = userData.user.user_metadata?.role;
        if (callerRole !== 'admin') {
            return json({ error: 'Admin role required' }, 403);
        }

        // ---- Parse request ----
        const body = await req.json().catch(() => ({}));
        const studentId = body.student_id;
        if (!studentId) {
            return json({ error: 'student_id is required' }, 400);
        }

        // ---- Admin client (bypasses RLS + can delete auth users) ----
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // ---- Load the student row first ----
        const { data: student, error: fetchErr } = await admin
            .from('students')
            .select('*')
            .eq('id', studentId)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!student) {
            return json({ error: 'Student not found' }, 404);
        }

        const regNo = student.reg_no;
        const email = student.email;
        const authUserId = student.auth_user_id;

        const summary: Record<string, unknown> = {
            reg_no: regNo,
            email,
            deleted: {
                files: 0,
                applications: 0,
                attempts: 0,
                student_row: false,
                auth_user: false
            }
        };

        // ---- 1) Delete uploaded documents from storage ----
        // Files live at: <folder>/<regSafe>_<filename>
        // Folders: passports/, admissions/, student-ids/, receipts/
        try {
            const folders = ['passports', 'admissions', 'student-ids', 'receipts'];
            const regSafe = (regNo || '').replace(/[^a-zA-Z0-9._-]/g, '_');
            let deletedFiles = 0;

            for (const folder of folders) {
                const { data: files, error: listErr } = await admin.storage
                    .from('membership-documents')
                    .list(folder, { limit: 200 });

                if (listErr) continue;
                if (!files || files.length === 0) continue;

                // Match files that start with our regSafe prefix
                const toDelete = files
                    .filter(f => f.name.startsWith(`${regSafe}_`))
                    .map(f => `${folder}/${f.name}`);

                if (toDelete.length === 0) continue;

                const { error: rmErr } = await admin.storage
                    .from('membership-documents')
                    .remove(toDelete);

                if (!rmErr) deletedFiles += toDelete.length;
            }
            summary.deleted.files = deletedFiles;
        } catch (e) {
            console.warn('File cleanup failed (continuing):', e);
        }

        // ---- 2) Delete membership_applications ----
        try {
            const { count: appCount } = await admin
                .from('membership_applications')
                .delete({ count: 'exact' })
                .or(`reg_no.eq.${regNo},reg_number.eq.${regNo},auth_user_id.eq.${authUserId}`);
            summary.deleted.applications = appCount || 0;
        } catch (e) {
            console.warn('Applications delete failed (continuing):', e);
            try {
                await admin.from('membership_applications').delete().eq('reg_no', regNo);
            } catch (e2) {}
        }

        // ---- 3) Delete cbt_attempts (best effort) ----
        try {
            const { count: attCount } = await admin
                .from('cbt_attempts')
                .delete({ count: 'exact' })
                .eq('reg_no', regNo);
            summary.deleted.attempts = attCount || 0;
        } catch (e) {
            console.warn('Attempts delete failed (continuing):', e);
        }

        // ---- 4) Delete the students row ----
        const { error: stuErr } = await admin
            .from('students')
            .delete()
            .eq('id', studentId);
        if (stuErr) throw stuErr;
        summary.deleted.student_row = true;

        // ---- 5) Delete the Supabase Auth user ----
        if (authUserId) {
            const { error: authDelErr } = await admin.auth.admin.deleteUser(authUserId);
            if (authDelErr) {
                console.warn('Auth user delete failed (continuing):', authDelErr);
            } else {
                summary.deleted.auth_user = true;
            }
        }

        // ---- Optionally try auth delete by email if auth_user_id was missing ----
        if (!summary.deleted.auth_user && email) {
            try {
                // List users by email (paginated search)
                const { data: list } = await admin.auth.admin.listUsers();
                const found = list?.users?.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
                if (found) {
                    await admin.auth.admin.deleteUser(found.id);
                    summary.deleted.auth_user = true;
                }
            } catch (e) {
                console.warn('Auth delete by email failed (continuing):', e);
            }
        }

        return json({ success: true, summary }, 200);

    } catch (err) {
        console.error('delete-student error:', err);
        return json({ error: String((err as Error).message || err) }, 500);
    }
});

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
