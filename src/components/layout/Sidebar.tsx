"use client";

import Link from "next/link";

import {
  BookOpen,
  ClipboardList,
  Grid2X2,
  GraduationCap,
  History,
  Settings,
  Sparkles,
  PanelLeft,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="hidden h-screen w-[190px] shrink-0 bg-[#f4f4f4] p-[7px] md:block">
      <div className="flex h-full flex-col rounded-[10px] border border-[#d9d9d9] bg-white px-[12px] py-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">

        {/* =====================================================
            LOGO
        ===================================================== */}

        <div className="flex items-center justify-between px-[3px]">

          <div className="flex items-center gap-[7px]">

            {/* VedaAI Logo */}

            <div className="flex h-[23px] w-[23px] items-center justify-center rounded-[6px] bg-[#303030]">
              <span className="text-[14px] font-black leading-none text-white">
                V
              </span>
            </div>

            <span className="whitespace-nowrap text-[16px] font-bold tracking-[-0.5px] text-[#303030]">
              VedaAI
            </span>

          </div>

          {/* Collapse Button */}

          <button
            type="button"
            aria-label="Collapse sidebar"
            className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[4px] text-[#777] transition hover:bg-[#f1f1f1] hover:text-[#303030]"
          >
            <PanelLeft
              size={13}
              strokeWidth={1.8}
            />
          </button>

        </div>


        {/* =====================================================
            AI TEACHER'S TOOLKIT
        ===================================================== */}

       <button
  type="button"
  className="mx-auto mt-[28px] flex h-[32px] w-[164px] shrink-0 items-center justify-center rounded-full border-[2px] border-[#ff6848] bg-[#303030] px-[8px] outline-none transition hover:bg-[#242424] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
>
  <span className="flex items-center justify-center gap-[6px] whitespace-nowrap">
    <Sparkles
      size={11}
      strokeWidth={2}
      className="shrink-0 text-white"
    />

    <span className="whitespace-nowrap text-[9px] font-medium leading-none text-white">
      AI Teacher's Toolkit
    </span>
  </span>
</button>


        {/* =====================================================
            NAVIGATION
        ===================================================== */}

        <nav className="mt-[22px] flex flex-col gap-[2px]">

          <SidebarItem
            href="/"
            icon={
              <Grid2X2
                size={13}
                strokeWidth={1.8}
              />
            }
            label="Home"
          />

          <SidebarItem
            href="#"
            icon={
              <GraduationCap
                size={13}
                strokeWidth={1.8}
              />
            }
            label="My Classroom"
          />

          <SidebarItem
            href="#"
            icon={
              <ClipboardList
                size={13}
                strokeWidth={1.8}
              />
            }
            label="Assignments"
          />

          <SidebarItem
            href="/upload"
            icon={
              <BookOpen
                size={13}
                strokeWidth={1.9}
              />
            }
            label="Exams"
            active
          />

          <SidebarItem
            href="#"
            icon={
              <History
                size={13}
                strokeWidth={1.8}
              />
            }
            label="My Library"
          />

        </nav>


        {/* =====================================================
            BOTTOM SECTION
        ===================================================== */}

        <div className="mt-auto">

          {/* SETTINGS */}

          <SidebarItem
            href="#"
            icon={
              <Settings
                size={13}
                strokeWidth={1.8}
              />
            }
            label="Settings"
          />


          {/* =================================================
              SCHOOL CARD
          ================================================= */}

          <div className="mt-[10px] rounded-[10px] bg-[#f0f0f0] px-[8px] py-[9px]">

            <div className="flex items-center gap-[8px]">

              {/* School Logo */}

              <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white text-[17px]">
                🏫
              </div>


              {/* School Information */}

              <div className="min-w-0 flex-1">

                <p className="truncate text-[10px] font-semibold leading-[13px] text-[#303030]">
                  Delhi Public School
                </p>

                <p className="truncate text-[9px] leading-[12px] text-[#888]">
                  Bokaro Steel City
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </aside>
  );
}


/* =========================================================
   SIDEBAR ITEM
========================================================= */

function SidebarItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        group
        flex
        h-[29px]
        w-full
        shrink-0
        items-center
        gap-[9px]
        rounded-[6px]
        px-[8px]
        text-[10px]
        transition-all
        duration-150

        ${
          active
            ? "bg-[#ededed] font-medium text-[#303030]"
            : "text-[#737373] hover:bg-[#f5f5f5] hover:text-[#303030]"
        }
      `}
    >

      {/* Icon */}

      <span
        className={`
          flex
          h-[16px]
          w-[16px]
          shrink-0
          items-center
          justify-center

          ${
            active
              ? "text-[#303030]"
              : "text-[#777]"
          }
        `}
      >
        {icon}
      </span>


      {/* Label */}

      <span className="truncate whitespace-nowrap">
        {label}
      </span>

    </Link>
  );
}