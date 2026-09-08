// import { Router } from 'express';
// import bcrypt from 'bcryptjs';
// import { supabase } from '../config/supabase.js';
// import { signToken, requireAuth } from '../middleware/auth.js';
// import { asyncHandler } from '../utils/helpers.js';

// const router = Router();

// router.post(
//   '/register',
//   asyncHandler(async (req, res) => {
//     const { company_name, name, email, password } = req.body;
//     if (!company_name || !name || !email || !password) {
//       return res.status(400).json({ error: 'company_name, name, email and password are required' });
//     }

//     const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
//     if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

//     const { data: company, error: companyErr } = await supabase
//       .from('companies')
//       .insert({ name: company_name })
//       .select()
//       .single();
//     if (companyErr) throw companyErr;

//     const { data: branch } = await supabase
//       .from('branches')
//       .insert({ company_id: company.id, name: 'Head Office', is_head_office: true })
//       .select()
//       .single();

//     const password_hash = await bcrypt.hash(password, 10);
//     const { data: user, error: userErr } = await supabase
//       .from('users')
//       .insert({
//         company_id: company.id,
//         branch_id: branch?.id,
//         name,
//         email,
//         password_hash,
//         role: 'super_admin',
//       })
//       .select('id, company_id, branch_id, name, email, role')
//       .single();
//     if (userErr) throw userErr;

//     const token = signToken(user);
//     res.status(201).json({ token, user, company });
//   })
// );

// router.post(
//   '/login',
//   asyncHandler(async (req, res) => {
//     const { email, password } = req.body;
//     if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

//     const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
//     if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });
//     if (!user.is_active) return res.status(403).json({ error: 'This account has been deactivated' });

//     const ok = await bcrypt.compare(password, user.password_hash);
//     if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

//     const token = signToken(user);
//     delete user.password_hash;
//     res.json({ token, user });
//   })
// );

// router.get(
//   '/me',
//   requireAuth,
//   asyncHandler(async (req, res) => {
//     res.json({ user: req.user });
//   })
// );

// export default router;






















import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { company_name, name, email, password } = req.body;
    if (!company_name || !name || !email || !password) {
      return res.status(400).json({ error: 'company_name, name, email and password are required' });
    }

    const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return res.status(409).json({ error: 'A user with this email already exists' });

    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .insert({ name: company_name })
      .select()
      .single();
    if (companyErr) throw companyErr;

    const { data: branch } = await supabase
      .from('branches')
      .insert({ company_id: company.id, name: 'Head Office', is_head_office: true })
      .select()
      .single();

    const password_hash = await bcrypt.hash(password, 10);
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({
        company_id: company.id,
        branch_id: branch?.id,
        name,
        email,
        password_hash,
        role: 'super_admin',
      })
      .select('id, company_id, branch_id, name, email, role')
      .single();
    if (userErr) throw userErr;

    const token = signToken(user);
    res.status(201).json({ token, user, company });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.is_active) return res.status(403).json({ error: 'This account has been deactivated' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    delete user.password_hash;
    res.json({ token, user });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

// ---------------------------------------------------------------------------
// BYPASS MODE — skips login/signup entirely while this is on.
// Turned on/off ONLY by the BYPASS_AUTH environment variable, no code
// changes needed to toggle it later. When on, this endpoint auto-creates
// (once) a shared "Demo Company" + demo super_admin user and hands out a
// real token for it — so the whole app works immediately with zero setup.
// To go back to normal login: remove BYPASS_AUTH (or set it to "false") on
// the backend, and VITE_BYPASS_AUTH on the frontend, then redeploy both.
// ---------------------------------------------------------------------------
router.post(
  '/bypass',
  asyncHandler(async (req, res) => {
    if (process.env.BYPASS_AUTH !== 'true') {
      return res.status(403).json({ error: 'Bypass mode is not enabled' });
    }

    const demoEmail = 'demo@dealeros.local';
    let { data: user } = await supabase.from('users').select('*').eq('email', demoEmail).maybeSingle();

    if (!user) {
      const { data: company, error: companyErr } = await supabase
        .from('companies')
        .insert({ name: 'Demo Company' })
        .select()
        .single();
      if (companyErr) throw companyErr;

      const { data: branch } = await supabase
        .from('branches')
        .insert({ company_id: company.id, name: 'Head Office', is_head_office: true })
        .select()
        .single();

      const password_hash = await bcrypt.hash('bypass-mode-not-a-real-password', 10);
      const { data: newUser, error: userErr } = await supabase
        .from('users')
        .insert({
          company_id: company.id,
          branch_id: branch?.id,
          name: 'Demo User',
          email: demoEmail,
          password_hash,
          role: 'super_admin',
        })
        .select('*')
        .single();
      if (userErr) throw userErr;
      user = newUser;
    }

    if (!user.is_active) return res.status(403).json({ error: 'Demo account is deactivated' });

    const token = signToken(user);
    delete user.password_hash;
    res.json({ token, user });
  })
);

export default router;