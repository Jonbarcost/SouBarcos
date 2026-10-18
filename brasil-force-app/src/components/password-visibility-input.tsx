"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordVisibilityInput() {
  const [visible, setVisible] = useState(false);
  const label = visible ? "Ocultar senha" : "Mostrar senha";

  return (
    <div className="password-visibility-field">
      <input
        name="password"
        type={visible ? "text" : "password"}
        required
        autoComplete="current-password"
        maxLength={128}
        style={{ paddingRight: "112px" }}
      />
      <button
        type="button"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        <span>{visible ? "Ocultar" : "Mostrar"}</span>
      </button>
      <style jsx>{`
        .password-visibility-field {
          position: relative;
          width: 100%;
        }
        .password-visibility-field button {
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 7px 8px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #244435;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .password-visibility-field button:hover {
          background: #e9eee7;
        }
        .password-visibility-field button:focus-visible {
          outline: 2px solid #285f46;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
