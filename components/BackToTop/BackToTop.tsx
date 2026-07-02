'use client';
import { useEffect } from "react";
import BackToTopButton from "./BackToTopButton";

function BackToTop() {
  useEffect(() => {
    const detectOnScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const backToTopButton = document.getElementById("back-to-top-button");
      if (!backToTopButton) return;

      if (scrollTop > 0) {
        backToTopButton.classList.add("show");
      } else {
        backToTopButton.classList.remove("show");
      }
    };

    window.addEventListener("scroll", detectOnScroll);

    return () => {
      window.removeEventListener("scroll", detectOnScroll);
    };
  }, []);

  return <BackToTopButton />;
}

export default BackToTop;