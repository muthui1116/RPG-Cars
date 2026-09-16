"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  // this state controls whether the mobile menu (hamburger dropdown) is open or closed
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        {/* logo on the left, links back to the homepage */}
        <Link href="/" className={styles.logo}>
          RPG-Cars
        </Link>

        {/* normal buttons, visible on big screens, hidden on small screens */}
        <div className={styles.navButtons}>
          {isLoggedIn ? (
            <>
              <span className={styles.userGreeting}>
                {session.user?.name ?? session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={styles.loginBtn}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>
                Login
              </Link>
              <Link href="/register" className={styles.registerBtn}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* hamburger icon, only visible on small screens */}
        <button className={styles.hamburger} onClick={toggleMenu}>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>

      {/* dropdown menu that shows on small screens when hamburger is clicked */}
      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          {isLoggedIn ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={styles.loginBtn}
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className={styles.loginBtn}>
                Login
              </Link>
              <Link href="/register" className={styles.registerBtn}>
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}