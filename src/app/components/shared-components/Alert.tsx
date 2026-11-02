"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface AlertProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose?: () => void;
  duration?: number;
}

const Alert: React.FC<AlertProps> = ({
  message,
  type,
  onClose,
  duration = 5000,
}) => {
  const t = useTranslations("Alert");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const styles = {
    base: "flex items-center justify-between gap-4 px-4 py-3 rounded shadow-md text-white min-w-[250px]",
    type: {
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500",
      info: "bg-blue-500", // Added info style
    },
  };

  const icons = {
    success: <CheckCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />, // Added info icon
  };

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <div
      role="alert"
      className={`${styles.base} ${styles.type[type]}`}
    >
      <div className="flex items-center gap-2">
        {icons[type]}
        <span>{t(message)}</span>
      </div>
      {/* <button onClick={handleClose}>
        <X size={16} />
      </button> */}
    </div>
  );
};

export default Alert;