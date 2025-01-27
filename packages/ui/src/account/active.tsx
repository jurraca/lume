import { useArk, useProfile } from "@lume/ark";
import { SettingsIcon, UserIcon } from "@lume/icons";
import { cn, useNetworkStatus } from "@lume/utils";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { minidenticon } from "minidenticons";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Logout } from "./logout";

export function ActiveAccount() {
	const ark = useArk();
	const isOnline = useNetworkStatus();
	const svgURI = useMemo(
		() =>
			`data:image/svg+xml;utf8,${encodeURIComponent(
				minidenticon(ark.account.pubkey, 90, 50),
			)}`,
		[],
	);

	const { user } = useProfile(ark.account.pubkey);

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<div className="relative">
					<Avatar.Root>
						<Avatar.Image
							src={user?.picture || user?.image}
							alt={ark.account.pubkey}
							loading="lazy"
							decoding="async"
							style={{ contentVisibility: "auto" }}
							className="aspect-square h-auto w-full rounded-xl object-cover"
						/>
						<Avatar.Fallback delayMs={150}>
							<img
								src={svgURI}
								alt={ark.account.pubkey}
								className="aspect-square h-auto w-full rounded-xl bg-black dark:bg-white"
							/>
						</Avatar.Fallback>
					</Avatar.Root>
					<span
						className={cn(
							"absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-neutral-100 dark:ring-neutral-900",
							isOnline ? "bg-teal-500" : "bg-red-500",
						)}
					/>
				</div>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					side="right"
					sideOffset={5}
					className="relative top-5 flex w-[200px] p-2 flex-col overflow-hidden rounded-2xl bg-white/50 dark:bg-black/50 ring-1 ring-black/10 dark:ring-white/10 backdrop-blur-2xl focus:outline-none"
				>
					<DropdownMenu.Item asChild>
						<Link
							to="/settings/profile"
							className="inline-flex items-center gap-3 px-3 text-sm font-medium rounded-lg h-9 text-black/70 hover:bg-black/10 hover:text-black focus:outline-none dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
						>
							<UserIcon className="size-4" />
							Edit profile
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Item asChild>
						<Link
							to="/settings/"
							className="inline-flex items-center gap-3 px-3 text-sm font-medium rounded-lg h-9 text-black/70 hover:bg-black/10 hover:text-black focus:outline-none dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
						>
							<SettingsIcon className="size-4" />
							Settings
						</Link>
					</DropdownMenu.Item>
					<DropdownMenu.Separator className="h-px my-1 bg-black/10 dark:bg-white/10" />
					<Logout />
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
