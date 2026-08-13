"use client";

import { useUser } from "@clerk/nextjs";

export default function LoginPage() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Not signed in</div>;
  }

  return <div>{user.username ?? user.firstName ?? user.primaryEmailAddress?.emailAddress}</div>;
}