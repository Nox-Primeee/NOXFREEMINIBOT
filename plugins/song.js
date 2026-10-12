const { cmd } = require("../nox");
const fetch = require("node-fetch");
const yts = require("yt-search");
const axios = require("axios");
const config = require('../config');
const { fakevCard } = require("../lib/fakevCard");
const style = require("../lib/style");

// ======================================================
// NOX FREE MINI BOT — SONG / VIDEO
// ======================================================

const NEWSLETTER_JID = "120363428923746817@newsletter";
const NEWSLETTER_NAME = config.BOT_NAME || 'NOX FREE MINI BOT';

const forwardedNewsletterMessageInfo = {
  newsletterJid: NEWSLETTER_JID,
  newsletterName: NEWSLETTER_NAME,
  serverMessageId: 3
};

// ======================================================
// TEXT (English only)
// ======================================================

const TEXT = {
  noQuery: "GIVE ME A SONG NAME OR LINK.",
  noResult: "NO RESULT FOUND.",
  audioError: "AUDIO COULD NOT BE GENERATED.",
  videoError: "VIDEO NOT FOUND.",
  apiError: "FAILED TO RETRIEVE THE VIDEO.",
  generalError: "AN ERROR OCCURRED, TRY AGAIN LATER.",
  quality: "QUALITY",
  unknown: "UNKNOWN TITLE",
  downloading: "DOWNLOADING..."
};

// ======================================================
// SONG / MP3
// ======================================================

cmd({
  pattern: "song",
  alias: ["ytmp3", "play", "mp3", "gana", "music", "audio"],
  react: "🎵",
  desc: "YouTube search & MP3 play",
  category: "download",
  use: ".song <name or link>",
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {

  try {

    const query = args.join(" ").trim();

    if (!query) {
      return reply(style.box('SONG', TEXT.noQuery));
    }

    await conn.sendMessage(from, {
      react: {
        text: "⏳",
        key: m.key
      }
    });

    // YouTube search
    const search = await yts(query);

    if (!search.videos || !search.videos.length) {
      return reply(style.box('SONG', TEXT.noResult));
    }

    const video = search.videos[0];

    // Audio API
    const apiUrl =
      `https://arslan-apis-v2.vercel.app/download/ytmp4?url=${encodeURIComponent(video.url)}`;

    const res = await axios.get(apiUrl, {
      timeout: 60000
    });

    if (
      !res.data ||
      !res.data.status ||
      !res.data.result ||
      !res.data.result.download ||
      !res.data.result.download.url
    ) {
      return reply(style.error(TEXT.audioError));
    }

    const dlUrl = res.data.result.download.url;
    const meta = res.data.result.metadata || {};

    const title =
      meta.title ||
      video.title ||
      TEXT.unknown;

    const quality =
      res.data.result.download.quality ||
      "128kbps";

    await conn.sendMessage(
      from,
      {
        audio: {
          url: dlUrl
        },
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${title.replace(/[\\/:*?"<>|]/g, "")}.mp3`,
        contextInfo: {
          forwardedNewsletterMessageInfo,
          forwardingScore: 1,
          isForwarded: true,

          externalAdReply: {
            title: title.substring(0, 40),
            body: "🌹🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ 𝐍𝚯𝐗 𝚯𝐅𝐅𝚰𝐂𝐈𝚫𝐋🧸",
            thumbnailUrl: video.thumbnail,
            sourceUrl: video.url,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      {
        quoted: fakevCard
      }
    );

    await conn.sendMessage(from, {
      react: {
        text: "✅",
        key: m.key
      }
    });

  } catch (err) {

    console.error("SONG ERROR:", err);

    await conn.sendMessage(from, {
      react: {
        text: "❌",
        key: m.key
      }
    });

    return reply(style.error(TEXT.generalError));
  }
});


// ======================================================
// VIDEO / MP4
// ======================================================

cmd({
  pattern: "video1",
  alias: ["vid", "ytv", "video"],
  react: "🎬",
  desc: "Download YouTube Video",
  category: "download",
  use: ".video <name or link>",
  filename: __filename
}, async (conn, mek, m, { from, q, args, reply }) => {

  try {

    const query = (q || args?.join(" ") || "").trim();

    if (!query) {
      return reply(style.box('VIDEO', `${TEXT.noQuery}\n\nEXAMPLE: .video Pasoori`));
    }

    await conn.sendMessage(from, {
      react: {
        text: "⏳",
        key: m.key
      }
    });

    let youtubeUrl;

    // If the user gives a direct link
    if (
      query.includes("youtube.com") ||
      query.includes("youtu.be")
    ) {

      youtubeUrl = query;

    } else {

      // YouTube search
      const search = await yts(query);

      if (
        !search ||
        !search.videos ||
        !search.videos.length
      ) {

        await conn.sendMessage(from, {
          react: {
            text: "❌",
            key: m.key
          }
        });

        return reply(style.box('VIDEO', TEXT.noResult));
      }

      youtubeUrl = search.videos[0].url;
    }

    // Video API
    const apiUrl =
      "https://gtech-api-xtp1.onrender.com/api/video/yt" +
      "?apikey=APIKEY&url=" +
      encodeURIComponent(youtubeUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(
        `Video API HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (!data || !data.status || !data.result) {

      await conn.sendMessage(from, {
        react: {
          text: "❌",
          key: m.key
        }
      });

      return reply(style.error(TEXT.apiError));
    }

    const media = data.result.media || {};

    const hd = media.video_url_hd;
    const sd = media.video_url_sd;

    let videoUrl = null;

    if (
      hd &&
      hd !== "No HD video URL available" &&
      !String(hd).includes("No HD")
    ) {

      videoUrl = hd;

    } else if (
      sd &&
      sd !== "No SD video URL available" &&
      !String(sd).includes("No SD")
    ) {

      videoUrl = sd;
    }

    if (!videoUrl) {

      await conn.sendMessage(from, {
        react: {
          text: "❌",
          key: m.key
        }
      });

      return reply(style.error(TEXT.videoError));
    }

    let videoTitle = config.BOT_NAME || 'NOX FREE MINI BOT';

    try {
      const searchInfo = await yts(youtubeUrl);

      if (
        searchInfo &&
        searchInfo.videos &&
        searchInfo.videos.length
      ) {
        videoTitle = searchInfo.videos[0].title;
      }
    } catch (_) {
      // Title is optional.
    }

    await conn.sendMessage(
      from,
      {
        video: {
          url: videoUrl
        },

        caption: `${style.box('VIDEO', videoTitle)}\n\n> Made By ${config.BOT_NAME || 'NOX FREE MINI BOT'}`,

        contextInfo: {
          forwardedNewsletterMessageInfo,
          forwardingScore: 1,
          isForwarded: true
        }
      },
      {
        quoted: fakevCard
      }
    );

    await conn.sendMessage(from, {
      react: {
        text: "✅",
        key: m.key
      }
    });

  } catch (err) {

    console.error("VIDEO ERROR:", err);

    await conn.sendMessage(from, {
      react: {
        text: "❌",
        key: m.key
      }
    });

    return reply(style.error(TEXT.generalError));
  }
});
