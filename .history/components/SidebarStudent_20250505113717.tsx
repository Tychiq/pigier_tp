"use client";

import Link from "next/link";
import Image from "next/image";


interface Props {
  fullName: string;
  avatar: string;
  email: string;
}

const SidebarStudent = ({ fullName, avatar, email }: Props) => {
  

  return (
    <aside className="sidebar">
      <Link href="/">
        <p className="text-4xl ml-3 font-extrabold font-poppins text-brand hidden h-auto lg:block">PigierTP</p>

        <Image
          src="/assets/icons/logo-brand.svg"
          alt="logo"
          width={52}
          height={52}
          className="lg:hidden"
        />
      </Link>
      
      <Image
        src="/assets/images/files-2.png"
        alt="logo"
        width={506}
        height={418}
        className="w-full"
      />

      <div className="sidebar-user-info">
        <Image
          src={avatar}
          alt="Avatar"
          width={44}
          height={44}
          className="sidebar-user-avatar"
        />
        <div className="hidden lg:block">
          <p className="subtitle-2 capitalize">{fullName}</p>
          <p className="caption">{email}</p>
        </div>
      </div>
    </aside>
  );
};
export default SidebarStudent;
