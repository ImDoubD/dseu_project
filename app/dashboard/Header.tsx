"use client";
import Image from "next/image";
import React, { useState } from "react";
import logo from "../images/logo.png";
import user from "../images/user.svg";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

interface Props {
  username: string;
}

export default function Header({ username }: Props) {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <>
      <div className="bg-white z-50 h-[60px] py-2 px-4 flex justify-between border-2  shadow-2xl shadow-slate-200 ">
        <div className="flex items-center space-x-2">
         {" "}<span className="text-lg">DSEU Student Portal </span>
        </div>
        <div className="relative">
          <div
            className=" flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              setOpen(!open);
            }}
          >
            <div><img height={40} width={40} alt="photo" src={user.src} />{" "}</div>
            <div>{username}</div>
          </div>
          <div
            className={`absolute p-1 right-0  top-14 w-36 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none" ${
              open ? "" : "hidden"
            }`}
          >
            <div className="hover:bg-black hover:text-white cursor-pointer  text-gray-900 group flex w-full items-center rounded-md px-2 py-2 text-sm">
              {" "}
              <PersonIcon className="scale-90" />
              &nbsp; Profile
            </div>
            <div className="hover:bg-black hover:text-white cursor-pointer  text-gray-900 group flex w-full items-center rounded-md px-2 py-2 text-sm">
              <LogoutIcon className="scale-90" />
              &nbsp; Logout
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
