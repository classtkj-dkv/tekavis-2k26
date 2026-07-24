import { getSupabaseAdmin } from './_lib/supabaseClient.js';
import { requireAuth } from './_lib/auth.js';
import { ok, serverError } from './_lib/response.js';

// GET /api/org-structure
// Menampilkan struktur organisasi kelas: tiap jabatan (Ketua, Wakil, Sekretaris,
// Bendahara, Keamanan, Kebersihan, dst — termasuk jabatan custom yang ditambah
// Owner) beserta siapa aja yang megang jabatan itu. Satu jabatan bisa diisi
// 1 orang atau lebih (misal Sekretaris 1 & Sekretaris 2) — tinggal assign role
// yang sama ke beberapa akun lewat halaman "Kelola User".
// Role 'owner', 'admin', dan 'siswa' sengaja tidak ditampilkan di sini karena
// bukan bagian dari struktur organisasi kelas (ada di bagian lain sistem).
export default requireAuth(async (req, res) => {
  try {
    const admin = getSupabaseAdmin();

    const { data: roles, error: roleError } = await admin
      .from('roles')
      .select('id, name, label')
      .not('name', 'in', '(owner,admin,siswa)')
      .order('label', { ascending: true });
    if (roleError) throw roleError;

    const { data: members, error: memberError } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, role_id');
    if (memberError) throw memberError;

    const structure = roles.map(role => ({
      ...role,
      members: members
        .filter(m => m.role_id === role.id)
        .map(m => ({ id: m.id, full_name: m.full_name, avatar_url: m.avatar_url })),
    }));

    return ok(res, structure);
  } catch (err) {
    return serverError(res, err);
  }
});
