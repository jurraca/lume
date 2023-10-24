import { NDKEvent, NDKKind, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { downloadDir } from '@tauri-apps/api/path';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { message, save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { motion } from 'framer-motion';
import { minidenticon } from 'minidenticons';
import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useNDK } from '@libs/ndk/provider';
import { useStorage } from '@libs/storage/provider';

import { AvatarUploader } from '@shared/avatarUploader';
import { ArrowLeftIcon, LoaderIcon } from '@shared/icons';
import { User } from '@shared/user';

export function CreateAccountScreen() {
  const [picture, setPicture] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<null | {
    npub: string;
    nsec: string;
    pubkey: string;
    privkey: string;
  }>(null);

  const {
    register,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm();
  const { db } = useStorage();
  const { ndk } = useNDK();

  const navigate = useNavigate();

  const svgURI =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(minidenticon('lume new account', 90, 50));

  const onSubmit = async (data: { name: string; about: string }) => {
    try {
      setLoading(true);

      const profile = {
        ...data,
        name: data.name,
        display_name: data.name,
        bio: data.about,
        picture: picture,
        avatar: picture,
      };

      const userPrivkey = generatePrivateKey();
      const userPubkey = getPublicKey(userPrivkey);
      const userNpub = nip19.npubEncode(userPubkey);
      const userNsec = nip19.nsecEncode(userPrivkey);

      const signer = new NDKPrivateKeySigner(userPrivkey);
      ndk.signer = signer;

      const event = new NDKEvent(ndk);
      event.content = JSON.stringify(profile);
      event.kind = NDKKind.Metadata;
      event.created_at = Math.floor(Date.now() / 1000);
      event.pubkey = userPubkey;
      event.tags = [];

      const publish = await event.publish();

      if (publish) {
        await db.createAccount(userNpub, userPubkey);
        await db.secureSave(userPubkey, userPrivkey);
        setKeys({
          npub: userNpub,
          nsec: userNsec,
          pubkey: userPubkey,
          privkey: userPrivkey,
        });
        setLoading(false);
      } else {
        toast('Create account failed');
        setLoading(false);
      }
    } catch (e) {
      return toast(e);
    }
  };

  const copyNsec = async () => {
    await writeText(keys.nsec);
  };

  const download = async () => {
    try {
      const downloadPath = await downloadDir();
      const fileName = `nostr_keys_${new Date().toISOString()}.txt`;
      const filePath = await save({
        defaultPath: downloadPath + '/' + fileName,
      });

      if (filePath) {
        await writeTextFile(
          filePath,
          `Nostr account, generated by Lume (lume.nu)\nPublic key: ${keys.npub}\nPrivate key: ${keys.nsec}`
        );

        setDownloaded(true);
      } // else { user cancel action }
    } catch (e) {
      await message(e, { title: 'Cannot download account keys', type: 'error' });
    }
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute left-[8px] top-2">
        {!keys ? (
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
              <ArrowLeftIcon className="h-5 w-5" />
            </div>
            Back
          </button>
        ) : null}
      </div>
      <div className="mx-auto flex w-full max-w-md flex-col gap-10">
        <h1 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Let&apos;s set up your account.
        </h1>
        <div className="flex flex-col gap-3">
          {!keys ? (
            <div className="rounded-xl bg-neutral-100 p-3 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              <form onSubmit={handleSubmit(onSubmit)} className="mb-0 flex flex-col">
                <input type={'hidden'} {...register('picture')} value={picture} />
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">Avatar</span>
                    <div className="relative flex h-36 w-full items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-800">
                      <img
                        src={picture || svgURI}
                        alt="user's avatar"
                        className="h-14 w-14 rounded-lg bg-black object-cover dark:bg-white"
                      />
                      <div className="absolute bottom-2 right-2">
                        <AvatarUploader setPicture={setPicture} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="name" className="font-semibold">
                      Name *
                    </label>
                    <input
                      type={'text'}
                      {...register('name', {
                        required: true,
                        minLength: 1,
                      })}
                      spellCheck={false}
                      className="h-11 rounded-lg bg-neutral-200 px-3 placeholder:text-neutral-500 dark:bg-neutral-800 dark:placeholder:text-neutral-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="about" className="font-semibold">
                      Bio
                    </label>
                    <textarea
                      {...register('about')}
                      spellCheck={false}
                      className="relative h-20 w-full resize-none rounded-lg bg-neutral-200 px-3 py-2 !outline-none placeholder:text-neutral-500 dark:bg-neutral-800 dark:placeholder:text-neutral-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!isDirty || !isValid}
                    className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-lg bg-blue-500 font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? (
                      <LoaderIcon className="h-5 w-4 animate-spin" />
                    ) : (
                      'Create and Continue'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="rounded-xl bg-neutral-100 p-3 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
              >
                <User pubkey={keys.pubkey} variant="simple" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 80 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="rounded-xl bg-neutral-100 p-3 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
              >
                <div className="flex flex-col gap-1.5">
                  <h5 className="font-semibold">Backup account</h5>
                  <div>
                    <p className="mb-2 select-text text-sm text-neutral-800 dark:text-neutral-200">
                      Your private key is your password. If you lose this key, you will
                      lose access to your account! Copy it and keep it in a safe place.{' '}
                      <span className="text-red-600">
                        There is no way to reset your private key.
                      </span>
                    </p>
                    <p className="select-text text-sm text-neutral-800 dark:text-neutral-200">
                      Public key is used for sharing with other people so that they can
                      find you using the public key.
                    </p>
                  </div>
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="nsec" className="text-sm font-semibold">
                        Private key
                      </label>
                      <div className="relative w-full">
                        <input
                          readOnly
                          value={
                            keys.nsec.substring(0, 10) + '**************************'
                          }
                          className="h-11 w-full rounded-lg bg-neutral-200 px-3 placeholder:text-neutral-500 dark:bg-neutral-800 dark:placeholder:text-neutral-400"
                        />
                        <div className="absolute right-0 top-0 inline-flex h-11 items-center justify-center px-2">
                          <button
                            type="button"
                            onClick={copyNsec}
                            className="rounded-md bg-neutral-300 px-2 py-1 text-sm font-medium hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="nsec" className="text-sm font-semibold">
                        Public key
                      </label>
                      <input
                        readOnly
                        value={keys.npub}
                        className="h-11 rounded-lg bg-neutral-200 px-3 placeholder:text-neutral-500 dark:bg-neutral-800 dark:placeholder:text-neutral-400"
                      />
                    </div>
                  </div>
                  {!downloaded ? (
                    <button
                      type="button"
                      onClick={() => download()}
                      className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-lg bg-blue-500 font-semibold text-white hover:bg-blue-600"
                    >
                      Download account keys
                    </button>
                  ) : null}
                </div>
              </motion.div>
            </>
          )}
          {downloaded ? (
            <motion.button
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-lg bg-blue-500 font-semibold text-white hover:bg-blue-600"
              type="button"
              onClick={() => navigate('/auth/onboarding', { state: { newuser: true } })}
            >
              Finish
            </motion.button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
