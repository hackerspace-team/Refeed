import Link from "next/link";
import router from "next/router";
import { memo } from "react";

import type { ItemType } from "@refeed/types/item";

import type { FeedTypes } from "../../types/feed";
import { FeedInfo } from "./FeedInfo";
import { Title } from "./FeedTitle";
import { MagazineImage } from "./MagazineImage";


export const MagazineItem = memo(
  (props: {
    i: number;
    item?: ItemType;
    FeedType: FeedTypes;
    markRead: () => void;
  }) => {
    const { item, markRead, FeedType } = props;

    const pathWithoutQuery = router.asPath.split("?")[0];

    return (
      <Link
        href={`${pathWithoutQuery}/?item=` + item?.id}
        replace={false}
        shallow
        scroll={false}
        onClick={() => {
          markRead();
        }}
      >
        <NonLinkedMagazineItem item={item} FeedType={FeedType} />
      </Link>
    );
  },
);

export const NonLinkedMagazineItem = ({
  item,
  FeedType,
}: {
  item?: ItemType;
  FeedType: FeedTypes;
}) => (
  <div
    className={`relative mx-1 flex w-screen flex-row space-x-[4px] rounded-md pb-2 pt-3 md:w-[33em]
          ${item?.marked_read ? "opacity-80" : ""}
        `}
  >
    <MagazineImage item={item!} FeedType={FeedType} />
    <div className="flex w-full flex-col">
      <Title FeedType={FeedType} title={item?.title ?? ""} />
      <FeedInfo FeedType={FeedType} item={item!} />
    </div>
  </div>
);

MagazineItem.displayName == "MagazineItem";
