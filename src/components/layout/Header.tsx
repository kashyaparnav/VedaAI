"use client";

import {
  Bell,
  ChevronDown,
  HelpCircle,
  Menu,
  Sparkles,
} from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between border-b border-[#e5e5e5] bg-white px-[18px] md:px-[22px]">

      {/* LEFT SIDE */}

      <div className="flex items-center gap-[10px]">

        {/* Mobile menu */}
        <button
          type="button"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full hover:bg-[#f3f3f3] md:hidden"
        >
          <Menu size={18} />
        </button>

      </div>


      {/* RIGHT SIDE */}

      <div className="flex items-center gap-[13px]">

        {/* Help */}

        <button
          type="button"
          className="hidden h-[26px] w-[26px] items-center justify-center rounded-full text-[#4b4b4b] hover:bg-[#f4f4f4] sm:flex"
        >
          <HelpCircle
            size={17}
            strokeWidth={1.8}
          />
        </button>


        {/* Notification */}

        <button
          type="button"
          className="relative flex h-[26px] w-[26px] items-center justify-center rounded-full text-[#4b4b4b] hover:bg-[#f4f4f4]"
        >
          <Bell
            size={17}
            strokeWidth={1.8}
          />

          <span className="absolute right-[2px] top-[2px] h-[5px] w-[5px] rounded-full bg-[#ff5630]" />
        </button>


        {/* AI sparkle */}

        <button
          type="button"
          className="hidden h-[26px] w-[26px] items-center justify-center rounded-full text-[#4b4b4b] hover:bg-[#f4f4f4] sm:flex"
        >
          <Sparkles
            size={17}
            strokeWidth={1.8}
          />
        </button>


        {/* User */}

        <button
          type="button"
          className="flex items-center gap-[7px] rounded-full px-[3px] py-[2px] hover:bg-[#f5f5f5]"
        >

          <div className="flex h-[27px] w-[27px] items-center justify-center overflow-hidden rounded-full bg-[#e8e8e8] text-[13px]">
            👨🏻
          </div>

          <span className="hidden text-[10px] font-medium text-[#333] sm:block">
            Madhur Rastogi
          </span>

          <ChevronDown
            size={13}
            className="text-[#777]"
          />

        </button>

      </div>

    </header>
  );
}