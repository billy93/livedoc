'use client';
import { useState, useRef, useEffect } from 'react';
import { ClientSideSuspense, RoomProvider } from '@liveblocks/react/suspense';
import { Editor } from '@/components/editor/Editor';
import { ClerkProvider } from '@clerk/nextjs';
import Header from "@/components/Header";
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import ActiveCollaborators from './ActiveCollaborators';
import { Input } from './ui/input';
import Image from 'next/image';
import { updateDocument } from '@/lib/actions/room.actions';
import Loader from './Loader';

interface CollaborativeRoomProps {
  roomId: string;
  roomMetadata: { title: string };
  users: any[]; // Adjust according to your actual user type
  currentUserType: 'editor' | 'viewer';
}



const CollaborativeRoom = ({ roomId, roomMetadata, users, currentUserType }: CollaborativeRoomProps) => {
 
  const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateTitleHandler = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setLoading(true);
      
      try{
        if(documentTitle!== roomMetadata.title){
          const updatedDocument = await updateDocument(roomId, documentTitle);

          if(updatedDocument){
            setEditing(false);
          }
        }
      }catch(error){
       console.log(error);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
        updateDocument(roomId,documentTitle);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roomId,documentTitle]);


  useEffect(()=>{
    if(editing && inputRef.current){
       inputRef.current.focus();
    }
  })

  return (
    <div>
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<Loader/>}>
          <div className='collaborative-room'>
            <Header>
              <div ref={containerRef} className='flex w-fit items-center justify-center gap'>
                {editing && !loading ? (
                  <Input
                    type="text"
                    value={documentTitle}
                    ref={inputRef}
                    placeholder='Enter the title'
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    onKeyDown={updateTitleHandler}
                    disabled={!editing}
                    className='document-title-input'
                  />
                ) : (
                  <>
                    <p className='document-title'>{documentTitle}</p>
                  </>
                )}
                {currentUserType === 'editor' && !editing && (
                  <Image
                    src='/assets/icons/edit.svg'
                    alt='edit'
                    width={24}
                    height={24}
                    onClick={() => setEditing(true)}
                    className='pointer'
                  />
                )}
                {currentUserType !== 'editor' && !editing && (
                  <p className='view-only-tag'>View only</p>
                )}
                {loading && <p className='text-sm text-gray-400'>saving...</p>}
              </div>

              <div className='flex w-full flex-1 justify-end gap-2 sm:gap-3'>
                <ActiveCollaborators />
                <SignedOut>
                  <SignInButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </Header>
            <Editor  roomId={roomId} currentUserType={currentUserType}/>
          </div>
        </ClientSideSuspense>
      </RoomProvider>
    </div>
  );
};

export default CollaborativeRoom;
