import dayjs from "dayjs";
import { useAtomValue } from "jotai";

import {
  useItemData,
  useUpdateMobileItemData,
} from "@refeed/features/item/useItemDataMobile";
import useMobileParams from "@refeed/features/item/useMobileParams";

import { settingsAtom } from "../lib/stores/settings";
import { trpc } from "../utils/trpc";

export const useUpdateBookmarks = () => {
  const settings = useAtomValue(settingsAtom);

  const { items } = useItemData();
  const { updateItemData } = useUpdateMobileItemData();
  const utils = trpc.useUtils();
  const { sort, FeedType, folder, feedId } = useMobileParams();

  const add = trpc.read.addReadLater.useMutation();
  const addTemp = trpc.read.addTempReadLater.useMutation();
  const remove = trpc.read.removeReadLater.useMutation();
  const removeTemp = trpc.read.removeTemp.useMutation();

  const markBookmarkRead = async (
    itemId: string,
    type: "Regular" | "Short Term",
  ) => {
    if (type === "Short Term") {
      toggleBookmark(itemId, settings.DefaultTimedBookmarkTime);
      await addTemp.mutateAsync({
        itemId,
        tempTimeAmount: settings.DefaultTimedBookmarkTime,
      });
    } else if (type === "Regular") {
      toggleBookmark(itemId);
      await add.mutateAsync({ itemId });
    }
  };

  const removeBookmark = async (
    itemId: string,
    type: "Regular" | "Short Term",
  ) => {
    if (type === "Short Term") {
      toggleBookmark(itemId);
      await removeTemp.mutateAsync({ itemId: itemId });
    } else if (type === "Regular") {
      toggleBookmark(itemId);
      await remove.mutateAsync({ itemId });
    }
  };

  const toggleBookmark = (itemId: string, tempTime?: number) => {
    // Update the local cache
    const newItems = items?.map((item) => {
      if (item.id == itemId) {
        return {
          ...item,
          in_read_later: !item.in_read_later,
          temp_added_time: tempTime
            ? dayjs().add(tempTime, "minute").toDate()
            : tempTime != null
              ? null
              : undefined,
        };
      } else {
        return item;
      }
    });
    updateItemData(newItems);

    // Make sure the bookmark and recently read feeds are updated when you add/remove a bookmark
    // Seems bugged for now
    if (FeedType != "bookmarks") {
      utils.item.getUnreadItems.reset({
        amount: 25,
        sort,
        type: "bookmarks",
        feed_id: feedId as string,
        folder: folder!,
      });
    }
  };

  return { markBookmarkRead, removeBookmark };
};
