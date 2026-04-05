"use client";
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    setIsScrolling(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setIsScrolling(false), 800);
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.8); }
          to   { opacity: 1; transform: translateY(0)   scale(1);   }
        }
        @keyframes fadeOutDown {
          from { opacity: 1; transform: translateY(0)   scale(1);   }
          to   { opacity: 0; transform: translateY(20px) scale(0.8); }
        }
        @keyframes ripple {
          0%   { transform: scale(0);   opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0;   }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-6px); }
        }
        @keyframes spin-once {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(-360deg); }
        }

        .scroll-top-btn {
          animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .scroll-top-btn.hidden-btn {
          animation: fadeOutDown 0.3s ease forwards;
        }
        .scroll-top-btn:not(.scrolling-active) {
          animation: fadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                     float 3s ease-in-out 0.4s infinite;
        }
        .scroll-top-btn.scrolling-active .arrow-icon {
          animation: spin-once 0.6s ease forwards;
        }
        .ripple-ring {
          animation: ripple 0.8s ease-out forwards;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 9999,
          pointerEvents: isVisible ? "auto" : "none",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            inset: "-8px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(2,29,73,0.35) 0%, transparent 70%)",
            filter: "blur(8px)",
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        />

        <button
          onClick={scrollToTop}
          className={`scroll-top-btn${isScrolling ? " scrolling-active" : ""}`}
          style={{
            position: "relative",
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #021d49 0%, #0a3d8f 50%, #1a5fb4 100%)",
            boxShadow: "0 8px 32px rgba(2,29,73,0.45), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
            opacity: isVisible ? 1 : 0,
            transition: "box-shadow 0.3s ease, transform 0.15s ease",
            overflow: "visible",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow =
              "0 12px 40px rgba(2,29,73,0.6), 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow =
              "0 8px 32px rgba(2,29,73,0.45), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.95)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
          aria-label="Scroll to top"
          title="Back to top"
        >
          {/* Shine overlay */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "50%",
            borderRadius: "52px 52px 0 0",
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />

          {/* Ripple on click */}
          {isScrolling && (
            <div
              key={Date.now()}
              className="ripple-ring"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.5)",
                pointerEvents: "none",
              }}
            />
          )}

          <ArrowUp
            className="arrow-icon"
            style={{ width: "22px", height: "22px", color: "#fff", flexShrink: 0 }}
            strokeWidth={2.5}
          />
        </button>
      </div>
    </>
  );
};

export default ScrollToTop;
