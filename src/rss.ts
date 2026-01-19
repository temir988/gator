import { XMLParser } from "fast-xml-parser";

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};
export async function fetchFeed(url: string) {
  const customHeaders = new Headers();
  customHeaders.append("User-Agent", "gator");
  customHeaders.append("accept", "application/rss+xml");
  const res = await fetch(url, {
    method: "GET",
    headers: customHeaders,
  });
  if (!res.ok) {
    throw new Error(`failed to fetch feed: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  const parser = new XMLParser();
  try {
    const rawData = parser.parse(text) as unknown;
    const data = validateFeed(rawData);
    return data;
  } catch {
    throw new Error("Feed is not valid");
  }
}

function validateFeed(rawFeed: unknown): RSSFeed {
  if (typeof rawFeed !== "object" || rawFeed === null) {
    throw new Error("Feed is not an object");
  }

  if (!("rss" in rawFeed)) {
    throw new Error("channel is not exist");
  }

  const { rss } = rawFeed;
  if (typeof rss !== "object" || rss === null) {
    throw new Error("Feed is not an object");
  }

  if (!("channel" in rss)) {
    throw new Error("channel is not exist");
  }

  const { channel } = rss;

  if (typeof channel !== "object" || channel === null) {
    throw new Error("channel is not an object");
  }

  if (
    !("title" in channel) ||
    !("link" in channel) ||
    !("description" in channel) ||
    !("item" in channel)
  ) {
    throw new Error("metadata is not correct");
  }

  if (
    typeof channel.link !== "string" ||
    typeof channel.title !== "string" ||
    typeof channel.description !== "string"
  ) {
    throw new Error("metadata is not correct");
  }

  const items: RSSItem[] = [];

  if (Array.isArray(channel.item)) {
    for (const i of channel.item) {
      try {
        if (isRSSItem(i)) {
          items.push(i);
        }
      } catch {
        continue;
      }
    }
  }

  if (typeof channel.item === "object" && channel.item !== null) {
    try {
      if (isRSSItem(channel.item)) {
        items.push(channel.item);
      }
    } catch {}
  }

  return {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: items,
    },
  };
}

function isRSSItem(item: object): item is RSSItem {
  if (
    !("title" in item) ||
    !("link" in item) ||
    !("description" in item) ||
    !("pubDate" in item)
  ) {
    throw new Error("metadata is not correct");
  }
  if (
    typeof item.link !== "string" ||
    typeof item.title !== "string" ||
    typeof item.description !== "string" ||
    typeof item.pubDate !== "string"
  ) {
    throw new Error("metadata is not correct");
  }

  return true;
}
