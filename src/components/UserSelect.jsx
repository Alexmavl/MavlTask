import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function UserSelect({ 
  value, 
  onChange, 
  members = [], 
  currentUser, 
  includeAllOption = false,
  allOptionLabel = "Todos los usuarios",
  disabled = false,
  className = "",
  darkTheme = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const getMemberData = (nameVal) => {
    if (nameVal === "all") return { name: allOptionLabel, type: "all" };
    if (nameVal === "Sin asignar") return { name: "Sin asignar", type: "unassigned" };
    const member = members.find(m => m.name === nameVal);
    if (member) return { ...member, type: "member" };
    return { name: nameVal, type: "unknown" };
  };

  const selectedData = getMemberData(value);

  const renderAvatar = (data, size = "w-5 h-5", textSize = "text-[9px]") => {
    if (data.type === "all") return <span className="mr-1">👥</span>;
    if (data.type === "unassigned" || data.type === "unknown") return <span className="mr-1 text-slate-400">⚪</span>;
    if (data.photoURL) {
      return (
        <img 
          src={data.photoURL} 
          alt={data.name} 
          className={`${size} rounded-full object-cover shadow-xs border ${darkTheme ? 'border-blue-900' : 'border-blue-200'} shrink-0`}
        />
      );
    }
    return (
      <div className={`${size} rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center font-bold text-white ${textSize} shrink-0`}>
        {(data.name || 'U').substring(0, 2).toUpperCase()}
      </div>
    );
  };

  // Estilos según el tema
  const buttonBase = "w-full flex items-center justify-between text-left px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const buttonDisabledLight = "bg-slate-100/70 cursor-not-allowed text-slate-700 border-slate-200";
  const buttonEnabledLight = "bg-white cursor-pointer hover:bg-slate-50 border-slate-200 text-slate-800";
  
  const buttonDisabledDark = "bg-[#0b192c] cursor-not-allowed text-slate-500 border-[#20436d]";
  const buttonEnabledDark = "bg-[#10243e] cursor-pointer hover:bg-[#1e3e62] border-[#20436d] text-slate-200";

  const popupLight = "bg-white border-slate-200 shadow-xl";
  const popupDark = "bg-[#0b192c] border-[#20436d] shadow-2xl";

  const optionLight = "hover:bg-slate-100 text-slate-700";
  const optionActiveLight = "bg-blue-50 text-blue-700";
  
  const optionDark = "hover:bg-[#1e3e62] text-slate-300";
  const optionActiveDark = "bg-blue-600 text-white";

  const dividerLight = "bg-slate-100";
  const dividerDark = "bg-[#1e3a5f]";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonBase} ${
          disabled 
            ? (darkTheme ? buttonDisabledDark : buttonDisabledLight)
            : (darkTheme ? buttonEnabledDark : buttonEnabledLight)
        } ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {renderAvatar(selectedData)}
          <span className="truncate text-xs font-semibold">
            {selectedData.name} {selectedData.id === currentUser?.id ? "(Tú)" : ""}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 ml-2 ${darkTheme ? 'text-slate-500' : 'text-slate-400'}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1.5 border rounded-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 p-1 ${darkTheme ? popupDark : popupLight}`}>
          {includeAllOption && (
            <div 
              onClick={() => handleSelect("all")}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                value === "all" ? (darkTheme ? optionActiveDark : optionActiveLight) : (darkTheme ? optionDark : optionLight)
              }`}
            >
              <span className="mr-1">👥</span>
              {allOptionLabel}
            </div>
          )}
          
          {members.map((m, idx) => (
            <div 
              key={idx}
              onClick={() => handleSelect(m.name)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                value === m.name ? (darkTheme ? optionActiveDark : optionActiveLight) : (darkTheme ? optionDark : optionLight)
              }`}
            >
              {renderAvatar({ ...m, type: "member" })}
              <span className="truncate">
                {m.name} {m.id === currentUser?.id ? "(Tú)" : ""}
              </span>
            </div>
          ))}

          <div className={`h-px my-1 mx-2 ${darkTheme ? dividerDark : dividerLight}`}></div>
          
          <div 
            onClick={() => handleSelect("Sin asignar")}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
              value === "Sin asignar" ? (darkTheme ? optionActiveDark : optionActiveLight) : (darkTheme ? optionDark : optionLight)
            }`}
          >
            <span className="mr-1 text-slate-400">⚪</span>
            Sin asignar
          </div>
        </div>
      )}
    </div>
  );
}
