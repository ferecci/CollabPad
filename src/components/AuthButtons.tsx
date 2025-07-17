'use client';
import { signIn, signOut } from 'next-auth/react';

export function SignInButton() {
  return (
    <button
      onClick={() => signIn('github')}
      className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-semibold"
    >
      Sign in with GitHub
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold"
    >
      Sign out
    </button>
  );
}
