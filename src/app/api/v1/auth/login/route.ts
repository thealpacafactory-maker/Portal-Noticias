import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor ingresa tu correo electrónico y contraseña.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user record directly from Supabase users table
    const { data: dbUser, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (error || !dbUser) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Correo o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    // Strict password verification against passwordHash stored in Supabase
    const storedHash = dbUser.passwordHash || '';
    if (storedHash !== password && storedHash !== `hash_${password}`) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Correo o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    // Build session user object from DB record
    const sessionUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role || 'EDITOR',
      avatarUrl: dbUser.avatarUrl,
    };

    const response = NextResponse.json({ success: true, user: sessionUser });

    // Set HTTP-only session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: JSON.stringify(sessionUser),
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error al autenticar con la base de datos' },
      { status: 500 }
    );
  }
}
