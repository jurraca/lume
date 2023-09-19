import { Image } from '@shared/image';

import { useProfile } from '@utils/hooks/useProfile';
import { displayNpub } from '@utils/shortenKey';

export function NotiUser({ pubkey }: { pubkey: string }) {
  const { status, user } = useProfile(pubkey);

  if (status === 'loading') {
    return (
      <div className="flex items-start gap-2">
        <div className="relative h-8 w-8 shrink-0 animate-pulse rounded-md bg-white/10" />
        <div className="flex w-full flex-1 flex-col items-start gap-1 text-start">
          <span className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center justify-start gap-2">
      <Image
        src={user?.picture || user?.image}
        alt={pubkey}
        className="h-8 w-8 shrink-0 rounded-md object-cover"
      />
      <span className="max-w-[10rem] truncate font-medium leading-none text-white">
        {user?.name || user?.display_name || displayNpub(pubkey, 16)}
      </span>
    </div>
  );
}