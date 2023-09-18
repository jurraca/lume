import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useCallback } from 'react';

import { useStorage } from '@libs/storage/provider';

import {
  ArticleNote,
  FileNote,
  NoteActions,
  NoteReplyForm,
  NoteStats,
  TextNote,
  UnknownNote,
} from '@shared/notes';
import { RepliesList } from '@shared/notes/replies/list';
import { NoteSkeleton } from '@shared/notes/skeleton';
import { TitleBar } from '@shared/titleBar';
import { User } from '@shared/user';

import { useEvent } from '@utils/hooks/useEvent';
import { Widget } from '@utils/types';

export function LocalThreadWidget({ params }: { params: Widget }) {
  const { db } = useStorage();
  const { status, data } = useEvent(params.content);

  const renderKind = useCallback(
    (event: NDKEvent) => {
      switch (event.kind) {
        case NDKKind.Text:
          return <TextNote content={event.content} />;
        case NDKKind.Article:
          return <ArticleNote event={event} />;
        case 1063:
          return <FileNote event={event} />;
        default:
          return <UnknownNote event={event} />;
      }
    },
    [data]
  );

  return (
    <div className="scrollbar-hide relative shrink-0 grow-0 basis-[400px] overflow-y-auto bg-white/10 backdrop-blur-xl">
      <TitleBar id={params.id} title={params.title} />
      <div className="h-full">
        {status === 'loading' ? (
          <div className="px-3 py-1.5">
            <div className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-xl">
              <NoteSkeleton />
            </div>
          </div>
        ) : (
          <div className="h-min w-full px-3 pt-1.5">
            <div className="rounded-xl bg-white/10 px-3 pt-3 backdrop-blur-xl">
              <User pubkey={data.pubkey} time={data.created_at} variant="thread" />
              <div className="mt-2">{renderKind(data)}</div>
              <NoteActions
                id={params.content}
                pubkey={data.pubkey}
                extraButtons={false}
              />
              <NoteStats id={params.content} />
            </div>
          </div>
        )}
        <div className="px-3">
          <NoteReplyForm id={params.content} pubkey={db.account.pubkey} />
          <RepliesList id={params.content} />
        </div>
      </div>
    </div>
  );
}
