import { cn } from "@lume/utils";
import { useUserContext } from "./provider";

export function UserCover({ className }: { className?: string }) {
	const user = useUserContext();

	if (!user) {
		return (
			<div
				className={cn(
					"animate-pulse bg-neutral-300 dark:bg-neutral-700",
					className,
				)}
			/>
		);
	}

	if (user && !user.banner) {
		return (
			<div
				className={cn("bg-gradient-to-b from-sky-400 to-sky-200", className)}
			/>
		);
	}

	return (
		<img
			src={user.banner}
			alt="banner"
			loading="lazy"
			decoding="async"
			style={{ contentVisibility: "auto" }}
			className={cn("object-cover", className)}
		/>
	);
}
