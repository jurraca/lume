import { NavArrowDownIcon } from "@lume/icons";
import { NDKEventWithReplies } from "@lume/types";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Note } from "..";
import { ChildReply } from "./childReply";

export function Reply({
	event,
	rootEvent,
}: {
	event: NDKEventWithReplies;
	rootEvent: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Collapsible.Root open={open} onOpenChange={setOpen}>
			<Note.Provider event={event}>
				<Note.Root>
					<Note.User className="h-14 px-3" />
					<Note.TextContent content={event.content} className="min-w-0 px-3" />
					<div className="-ml-1 flex items-center justify-between h-14 px-3">
						{event.replies?.length > 0 ? (
							<Collapsible.Trigger asChild>
								<div className="ml-1 inline-flex h-14 items-center gap-1 font-semibold text-blue-500">
									<NavArrowDownIcon
										className={twMerge(
											"h-3 w-3",
											open ? "rotate-180 transform" : "",
										)}
									/>
									{`${event.replies?.length} ${
										event.replies?.length === 1 ? "reply" : "replies"
									}`}
								</div>
							</Collapsible.Trigger>
						) : null}
						<div className="inline-flex items-center gap-10">
							<Note.Reply rootEventId={rootEvent} />
							<Note.Reaction />
							<Note.Repost />
							<Note.Zap />
						</div>
					</div>
					<div className={twMerge("px-3", open ? "pb-3" : "")}>
						{event.replies?.length > 0 ? (
							<Collapsible.Content>
								{event.replies?.map((childEvent) => (
									<ChildReply key={childEvent.id} event={childEvent} />
								))}
							</Collapsible.Content>
						) : null}
					</div>
				</Note.Root>
			</Note.Provider>
		</Collapsible.Root>
	);
}
