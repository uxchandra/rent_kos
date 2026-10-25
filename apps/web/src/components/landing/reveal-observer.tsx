"use client";

import { useEffect } from "react";

/**
 * Pasang sekali per halaman. Memberi [data-shown] pada setiap elemen [data-reveal] saat masuk layar
 * dan melepasnya lagi saat keluar, sehingga animasi di globals.css diputar ulang setiap kali
 * elemen di-scroll ke dalam layar (dari atas maupun bawah).
 */
export function RevealObserver() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.setAttribute("data-shown", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Muncul saat cukup terlihat; disembunyikan lagi baru setelah benar-benar keluar layar
          // supaya tidak berkedip di tepi layar.
          if (e.isIntersecting && e.intersectionRatio >= 0.12) e.target.setAttribute("data-shown", "");
          else if (!e.isIntersecting) e.target.removeAttribute("data-shown");
        }
      },
      { threshold: [0, 0.12] },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
