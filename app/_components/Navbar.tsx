"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import styles from "./Navbar.module.css";

const ADMIN_ROLE = 1;

function getFirstName(name?: string | null, email?: string | null) {
  if (name) return name.trim().split(" ")[0];
  if (email) return email.split("@")[0];
  return "";
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const isAdmin = isLoggedIn && session?.user?.role === ADMIN_ROLE;

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleUserMenu = () => setIsUserMenuOpen((prev) => !prev);

  const firstName = getFirstName(session?.user?.name, session?.user?.email);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.logo}>
          RPG-Zoe
        </Link>

        <div className={styles.navButtons}>
          {isLoggedIn ? (
            <div className={styles.userMenuWrapper} ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className={styles.userTrigger}
                aria-expanded={isUserMenuOpen}
              >
                <span className={styles.userInfo}>
                  <span className={styles.userName}>{firstName}</span>
                  <span
                    className={`${styles.roleBadge} ${
                      isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeCustomer
                    }`}
                  >
                    {isAdmin ? "Admin" : "Customer"}
                  </span>
                </span>
                <svg
                  className={`${styles.chevron} ${isUserMenuOpen ? styles.chevronOpen : ""}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className={styles.userDropdown}>
                  {isAdmin && (
                    <Link
                      href="/admin/orders"
                      className={styles.dropdownItem}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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

        <button className={styles.hamburger} onClick={toggleMenu}>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>

      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          {isLoggedIn ? (
            <>
              <div className={styles.mobileUserRow}>
                <span className={styles.userInfo}>
                  <span className={styles.userName}>{firstName}</span>
                  <span
                    className={`${styles.roleBadge} ${
                      isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeCustomer
                    }`}
                  >
                    {isAdmin ? "Admin" : "Customer"}
                  </span>
                </span>
              </div>
              {isAdmin && (
                <Link
                  href="/admin/orders"
                  className={styles.loginBtn}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
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
      )}
    </nav>
  );
}