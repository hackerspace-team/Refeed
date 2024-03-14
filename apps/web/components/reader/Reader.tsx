import { memo, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { motion } from "framer-motion";
import { atom, useAtom, useSetAtom } from "jotai";
import Carousel from "nuka-carousel";

import { useUser } from "@refeed/features/hooks/useUser";
import { useItemData } from "@refeed/features/item/useItemDataWeb";
import { usePlan } from "@refeed/features/payment/usePlan";
import { debounce } from "@refeed/lib/debounce";
import type { ItemType } from "@refeed/types/item";

import { BookmarkButton } from "../../features/bookmarks/BookmarkButton";
import BookmarkFolderButton from "../../features/bookmarks/BookmarkFolderButton";
import { ShortTermBookmarkButton } from "../../features/bookmarks/ShortTermBookmarkButton";
import { useUpdateFeeds } from "../../features/feed/useUpdateFeeds";
import { PricingDialog } from "../../features/pricing/PricingDialog";
import useWindowSize from "../../lib/useWindowSize";
import { trpc } from "../../utils/trpc";
import Sharing from "../sharing/Sharing";
import { Article } from "./Article";
import { CopyLinkButton } from "./CopyLinkButton";
import { useReaderAnimation } from "./useReaderAnimation";
import { useReaderNavigation } from "./useReaderNavigation";

export const fullscreenAtom = atom(false);
export const AIDrawerOpen = atom(false);

const Reader = () => {
  // To prevent the sharing from popping in
  trpc.settings.getShareProviders.useQuery();

  const { width: windowWidth } = useWindowSize();

  const { items, FeedType, fetchNextPage } = useItemData();
  const { closeReader, initialIndex, isLoaded, searchItem } =
    useReaderNavigation(items);
  const { fullscreen, widthStyle, transitionDuration } = useReaderAnimation();

  const [aIDrawerOpen, setAIDrawerOpen] = useAtom(AIDrawerOpen);

  if (isLoaded || searchItem) {
    return (
      <>
        <motion.div
          layout="preserve-aspect"
          className={clsx(
            "fixed z-30 w-full transform overflow-hidden bg-white py-0.5 md:left-auto md:w-[65%] dark:bg-[#0f0f10]",
            windowWidth! > 500 &&
              (fullscreen
                ? `left-0 right-0 top-0 h-full`
                : `${aIDrawerOpen ? "right-[16.5%] rounded-lg" : "right-1 rounded-lg"} left-1 top-1.5 mx-1 h-[98.5vh] border-[1.5px] border-neutral-400/25 shadow-[rgba(0,0,0,0.05)_0px_0px_1px,rgba(0,0,0,0.04)_0px_15px_30px] lg:w-[36%] dark:border-[#24252A] dark:bg-[#0f0f10] dark:shadow-none`),
          )}
          transition={{
            duration: 0.2,
          }}
          style={widthStyle}
        >
          <div className="flex flex-row items-center rounded-t border-b border-[#f0f0f0] bg-[#fcfcfc] py-2.5 font-bold dark:border-[#303030]/90 dark:bg-[#141415]">
            <BackButton onBackClick={() => closeReader()} />
            <div className={`${fullscreen ? "mx-auto w-[680px]" : "w-[90%]"}`}>
              <div
                className={`flex ${fullscreen ? "w-[90%]" : "ml-1"} justify-between`}
              >
                <Topbar className={!fullscreen ? "ml-1" : ""} />
                <div className="flex">
                  <Sharing />
                </div>
              </div>
            </div>
          </div>
          <div>
            <MemoizedCarousel
              fullscreen={fullscreen}
              items={searchItem ? [searchItem] : items}
              initialIndex={searchItem ? 0 : initialIndex}
              fetchNextPage={() => fetchNextPage}
              FeedType={FeedType}
            />
          </div>
        </motion.div>
      </>
    );
  }
};

export default Reader;

const MemoizedCarousel = memo(function RenderCarousel({
  items,
  initialIndex,
  fetchNextPage,
  FeedType,
  fullscreen,
}: {
  items: ItemType[];
  initialIndex: number;
  fetchNextPage: () => void;
  FeedType: FeedType;
  fullscreen: boolean;
}) {
  // Items to keep loaded around the current index
  const bufferRange = 20;

  const startIndex = Math.max(0, initialIndex - bufferRange);
  const endIndex = Math.min(items.length, initialIndex + bufferRange + 1);

  // Create a new array with placeholders for items outside the buffer range
  const newBufferedItems = items.map((item, index) =>
    index >= startIndex && index < endIndex ? item : { id: item.id },
  ) as ItemType[];

  const { markRead } = useUpdateFeeds(items, FeedType);
  const { replace, asPath } = useRouter();
  const pathWithoutQuery = asPath.split("?")[0];

  const debouncedReplace = useRef(
    debounce((endSlideIndex) => {
      replace(
        `${pathWithoutQuery}?item=` + newBufferedItems[endSlideIndex]!.id,
        undefined,
        { shallow: true, scroll: false },
      );
    }, 500),
  );

  useEffect(() => {
    return () => {
      debouncedReplace.current.cancel();
    };
  }, []);

  /* A lot of chrome specfic bugs happening here. Make sure
    to check another browser If theirs a bug here */
  return (
    <Carousel
      withoutControls={true}
      renderAnnounceSlideMessage={undefined}
      enableKeyboardControls={true}
      dragging={false}
      swiping={true}
      speed={fullscreen ? 0 : 500}
      slideIndex={initialIndex}
      slidesToScroll="auto"
      afterSlide={(endSlideIndex) => {
        markRead(newBufferedItems[endSlideIndex]!);
      }}
      beforeSlide={(_, endSlideIndex) => {
        if (endSlideIndex == newBufferedItems.length - 1) {
          fetchNextPage();
        }
        debouncedReplace.current(endSlideIndex);
      }}
    >
      {newBufferedItems?.map((item) => (
        <div
          key={item.id}
          className="scrollbar-rounded-md w-full overflow-y-scroll overscroll-none scrollbar scrollbar-thumb-neutral-300 scrollbar-thumb-rounded-md scrollbar-w-1 md:overscroll-contain dark:bg-[#0f0f10] dark:scrollbar-thumb-[#404245]"
        >
          {item.title && (
            <div className={fullscreen ? "mx-auto md:w-[650px]" : "w-full"}>
              <div className="flex h-[calc(100svh-3.4rem)] flex-col items-center pt-[1px]">
                <Article
                  FeedType={FeedType}
                  item={item}
                  Type={fullscreen ? "Full" : "Popup"}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </Carousel>
  );
});

const BackButton = ({ onBackClick }: { onBackClick: () => void }) => {
  const setAIDrawerOpen = useSetAtom(AIDrawerOpen);

  return (
    <button
      className="animate-fade-in-up mx-2 rounded p-1 transition-all hover:bg-[#F5F5F5] dark:hover:bg-[#0f0f0f]"
      onClick={() => {
        setAIDrawerOpen(false), onBackClick();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        className="h-[22px] w-[22px] stroke-neutral-450 dark:stroke-neutral-500"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
};

export const Topbar = ({ className }: { className?: string }) => {
  const { plan } = useUser();

  return (
    <div className={clsx("flex items-center gap-5", className)}>
      <Dialog.Root>
        <BookmarkButton />
        <BookmarkFolderButton />
        <ShortTermBookmarkButton />
        <CopyLinkButton />
        {plan == "free" && (
          <PricingDialog setDialogUndefined={() => undefined} />
        )}
      </Dialog.Root>
    </div>
  );
};

export const ArticleTopbar = ({
  className,
  openItemFromArticle,
}: {
  className?: string;
  openItemFromArticle: ItemType;
}) => {
  const { plan } = useUser();

  return (
    <div className={clsx("flex items-center gap-5", className)}>
      <Dialog.Root>
        <BookmarkButton openItemFromArticle={openItemFromArticle} />
        <BookmarkFolderButton openItemFromArticle={openItemFromArticle} />
        <ShortTermBookmarkButton openItemFromArticle={openItemFromArticle} />
        <CopyLinkButton />
        {plan == "free" && (
          <PricingDialog setDialogUndefined={() => undefined} />
        )}
      </Dialog.Root>
    </div>
  );
};
