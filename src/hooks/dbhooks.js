import { useState } from "react";
import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";

// Create database and playlist store/collection
const db = new Dexie("IPTV");
db.version(1).stores({
  playlists: "++id,&name,data",
});

const useLivePlaylistNames = () => {
  const [playlistNames, setPlaylistNames] = useState([]);
  useLiveQuery(() => {
    db.playlists.orderBy("name").keys((keys) => {
      setPlaylistNames(keys);
    });
  }, []);
  return playlistNames;
};

export { useLivePlaylistNames };
