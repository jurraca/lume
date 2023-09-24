import { useDraggable } from '@dnd-kit/core';
import * as Dialog from '@radix-ui/react-dialog';
import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useStorage } from '@libs/storage/provider';

import { Image } from '@shared/image';
import { NIP05 } from '@shared/nip05';
import { TextNote } from '@shared/notes';
import { User } from '@shared/user';

import { useNostr } from '@utils/hooks/useNostr';
import { useProfile } from '@utils/hooks/useProfile';
import { displayNpub } from '@utils/shortenKey';

export const UserDrawer = memo(function UserDrawer({ pubkey }: { pubkey: string }) {
  const { db } = useStorage();
  const { status, user } = useProfile(pubkey);
  const { addContact, removeContact } = useNostr();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: pubkey,
  });

  const [followed, setFollowed] = useState(false);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 20,
      }
    : undefined;

  const followUser = (pubkey: string) => {
    try {
      addContact(pubkey);

      // update state
      setFollowed(true);
    } catch (error) {
      console.log(error);
    }
  };

  const unfollowUser = (pubkey: string) => {
    try {
      removeContact(pubkey);

      // update state
      setFollowed(false);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (db.account.follows.includes(pubkey)) {
      setFollowed(true);
    }
  }, []);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
        >
          <User pubkey={pubkey} variant="avatar" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-[400px] items-center justify-center px-4 pb-4 pt-16">
          <div className="h-full w-full overflow-y-auto rounded-lg border-t border-white/10 bg-white/20 px-3 py-3 backdrop-blur-3xl">
            {status === 'loading' ? (
              <div>
                <p>Loading...</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <Image
                  src={user?.picture || user?.image}
                  alt={pubkey}
                  className="h-14 w-14 rounded-lg"
                />
                <div className="mt-2 flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <h5 className="text-lg font-semibold leading-none">
                      {user?.displayName || user?.name || 'No name'}
                    </h5>
                    {user?.nip05 ? (
                      <NIP05
                        pubkey={pubkey}
                        nip05={user?.nip05}
                        className="max-w-[15rem] truncate text-sm leading-none text-white/50"
                      />
                    ) : (
                      <span className="max-w-[15rem] truncate text-sm leading-none text-white/50">
                        {displayNpub(pubkey, 16)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-4">
                    {user.about ? <TextNote content={user.about} /> : null}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2">
                    {followed ? (
                      <button
                        type="button"
                        onClick={() => unfollowUser(pubkey)}
                        className="inline-flex h-10 w-36 items-center justify-center rounded-md bg-white/10 text-sm font-medium backdrop-blur-xl hover:bg-fuchsia-500"
                      >
                        Unfollow
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => followUser(pubkey)}
                        className="inline-flex h-10 w-36 items-center justify-center rounded-md bg-white/10 text-sm font-medium backdrop-blur-xl hover:bg-fuchsia-500"
                      >
                        Follow
                      </button>
                    )}
                    <Link
                      to={`/chats/${pubkey}`}
                      className="inline-flex h-10 w-36 items-center justify-center rounded-md bg-white/10 text-sm font-medium backdrop-blur-xl hover:bg-fuchsia-500"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
});
