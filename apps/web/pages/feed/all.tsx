import type { NextPage } from "next";
import { FeedLayout } from "@components/feed/FeedLayout";
import SideBar from "@components/layout/SideBar";

import CommandPalette from "../../components/cmdk/CommandPalette";
import NavBar from "../../components/layout/NavBar";
import { PageWrapper } from "../../components/layout/PageWrapper";
import Reader from "../../components/reader/Reader";

const All: NextPage = () => {
  return (
    <PageWrapper>
      <CommandPalette />
      <SideBar />
      <div className={`flex h-[100vh] w-full flex-col`}>
        <Reader />
        <NavBar title="All Feeds" />
        <FeedLayout FeedType="all" />
      </div>
    </PageWrapper>
  );
};

export default All;