import { cn } from "@lume/utils";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { fetch } from "@tauri-apps/plugin-http";
import getUrls from "get-urls";
import { nanoid } from "nanoid";
import { nip19 } from "nostr-tools";
import { ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import reactStringReplace from "react-string-replace";
import {
	Hashtag,
	ImagePreview,
	LinkPreview,
	MentionNote,
	MentionUser,
	VideoPreview,
	useNoteContext,
	useStorage,
} from "../..";
import { NIP89 } from "./nip89";

const NOSTR_MENTIONS = [
	"@npub1",
	"nostr:npub1",
	"nostr:nprofile1",
	"nostr:naddr1",
	"npub1",
	"nprofile1",
	"naddr1",
	"Nostr:npub1",
	"Nostr:nprofile1",
	"Nostr:naddre1",
];

const NOSTR_EVENTS = [
	"@nevent1",
	"@note1",
	"@nostr:note1",
	"@nostr:nevent1",
	"nostr:note1",
	"note1",
	"nostr:nevent1",
	"nevent1",
	"Nostr:note1",
	"Nostr:nevent1",
];

// const BITCOINS = ['lnbc', 'bc1p', 'bc1q'];

const IMAGES = ["jpg", "jpeg", "gif", "png", "webp", "avif", "tiff"];

const VIDEOS = [
	"mp4",
	"mov",
	"webm",
	"wmv",
	"flv",
	"mts",
	"avi",
	"ogv",
	"mkv",
	"m3u8",
];

const AUDIOS = ["mp3", "ogg", "wav"];

export function NoteContent({
	className,
}: {
	className?: string;
}) {
	const storage = useStorage();
	const event = useNoteContext();

	const [content, setContent] = useState(event.content);
	const [translated, setTranslated] = useState(false);

	const richContent = useMemo(() => {
		if (event.kind !== NDKKind.Text) return content;

		let parsedContent: string | ReactNode[] = content.replace(/\n+/g, "\n");
		let linkPreview: string;
		let images: string[] = [];
		let videos: string[] = [];
		let audios: string[] = [];
		let events: string[] = [];

		const text = parsedContent;
		const words = text.split(/( |\n)/);
		const urls = [...getUrls(text)];

		if (storage.settings.media && !storage.settings.lowPower) {
			images = urls.filter((word) =>
				IMAGES.some((el) => {
					const url = new URL(word);
					const extension = url.pathname.split(".")[1];
					if (extension === el) return true;
					return false;
				}),
			);
			videos = urls.filter((word) =>
				VIDEOS.some((el) => {
					const url = new URL(word);
					const extension = url.pathname.split(".")[1];
					if (extension === el) return true;
					return false;
				}),
			);
			audios = urls.filter((word) =>
				AUDIOS.some((el) => {
					const url = new URL(word);
					const extension = url.pathname.split(".")[1];
					if (extension === el) return true;
					return false;
				}),
			);
		}

		events = words.filter((word) =>
			NOSTR_EVENTS.some((el) => word.startsWith(el)),
		);

		const hashtags = words.filter((word) => word.startsWith("#"));
		const mentions = words.filter((word) =>
			NOSTR_MENTIONS.some((el) => word.startsWith(el)),
		);

		try {
			if (images.length) {
				for (const image of images) {
					parsedContent = reactStringReplace(
						parsedContent,
						image,
						(match, i) => <ImagePreview key={match + i} url={match} />,
					);
				}
			}

			if (videos.length) {
				for (const video of videos) {
					parsedContent = reactStringReplace(
						parsedContent,
						video,
						(match, i) => <VideoPreview key={match + i} url={match} />,
					);
				}
			}

			if (audios.length) {
				for (const audio of audios) {
					parsedContent = reactStringReplace(
						parsedContent,
						audio,
						(match, i) => <VideoPreview key={match + i} url={match} />,
					);
				}
			}

			if (hashtags.length) {
				for (const hashtag of hashtags) {
					parsedContent = reactStringReplace(
						parsedContent,
						hashtag,
						(match, i) => {
							if (storage.settings.hashtag)
								return <Hashtag key={match + i} tag={hashtag} />;
							return null;
						},
					);
				}
			}

			if (events.length) {
				for (const event of events) {
					const address = event
						.replace("nostr:", "")
						.replace(/[^a-zA-Z0-9]/g, "");
					const decoded = nip19.decode(address);

					if (decoded.type === "note") {
						parsedContent = reactStringReplace(
							parsedContent,
							event,
							(match, i) => (
								<MentionNote key={match + i} eventId={decoded.data} />
							),
						);
					}

					if (decoded.type === "nevent") {
						parsedContent = reactStringReplace(
							parsedContent,
							event,
							(match, i) => (
								<MentionNote key={match + i} eventId={decoded.data.id} />
							),
						);
					}
				}
			}

			if (mentions.length) {
				for (const mention of mentions) {
					const address = mention
						.replace("nostr:", "")
						.replace("@", "")
						.replace(/[^a-zA-Z0-9]/g, "");
					const decoded = nip19.decode(address);

					if (decoded.type === "npub") {
						parsedContent = reactStringReplace(
							parsedContent,
							mention,
							(match, i) => (
								<MentionUser key={match + i} pubkey={decoded.data} />
							),
						);
					}

					if (decoded.type === "nprofile" || decoded.type === "naddr") {
						parsedContent = reactStringReplace(
							parsedContent,
							mention,
							(match, i) => (
								<MentionUser key={match + i} pubkey={decoded.data.pubkey} />
							),
						);
					}
				}
			}

			parsedContent = reactStringReplace(
				parsedContent,
				/(https?:\/\/\S+)/g,
				(match, i) => {
					const url = new URL(match);

					if (!linkPreview) {
						linkPreview = match;
						return <LinkPreview key={match + i} url={url.toString()} />;
					}

					return (
						<Link
							key={match + i}
							to={url.toString()}
							target="_blank"
							rel="noreferrer"
							className="break-all font-normal text-blue-500 hover:text-blue-600"
						>
							{url.toString()}
						</Link>
					);
				},
			);

			parsedContent = reactStringReplace(parsedContent, "\n", () => {
				return <div key={nanoid()} className="h-3" />;
			});

			if (typeof parsedContent[0] === "string") {
				parsedContent[0] = parsedContent[0].trimStart();
			}

			return parsedContent;
		} catch (e) {
			console.warn("[parser] parse failed: ", e);
			return parsedContent;
		}
	}, [content]);

	const translate = async () => {
		try {
			const res = await fetch("https://translate.nostr.wine/translate", {
				method: "POST",
				body: JSON.stringify({
					q: content,
					target: "vi",
					api_key: storage.settings.translateApiKey,
				}),
				headers: { "Content-Type": "application/json" },
			});

			const data = await res.json();

			setContent(data.translatedText);
			setTranslated(true);
		} catch (e) {
			console.error(String(e));
		}
	};

	if (event.kind !== NDKKind.Text) {
		return <NIP89 className={className} />;
	}

	return (
		<div className={cn("", className)}>
			<div className="break-p select-text whitespace-pre-line text-balance leading-normal">
				{richContent}
			</div>
			{storage.settings.translation ? (
				translated ? (
					<button
						type="button"
						onClick={() => {
							setTranslated(false);
							setContent(event.content);
						}}
						className="mt-2 text-sm text-blue-500 hover:text-blue-600 border-none shadow-none focus:outline-none"
					>
						Show original content
					</button>
				) : (
					<button
						type="button"
						onClick={translate}
						className="mt-2 text-sm text-blue-500 hover:text-blue-600 border-none shadow-none focus:outline-none"
					>
						Translate to Vietnamese
					</button>
				)
			) : null}
		</div>
	);
}
