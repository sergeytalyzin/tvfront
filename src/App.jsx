import { Input } from 'antd';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Hls from 'hls.js';

const fetchChannels = async () => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/proxy?url=https://reflextv.ru/playlist/hls/sguwzjitps.m3u`,
  );
  const lines = response.data.split('\n');
  const channels = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const name = lines[i].split(',')[1]; // Название канала
      const url = lines[i + 1]; // Ссылка на поток
      channels.push({ name, url });
    }
  }

  return channels;
};




const Tv = () => {
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState('');
  const [search, setSearch] = useState('');
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  useEffect(() => {
    // Загрузка списка каналов
    const loadChannels = async () => {
      const channelList = await fetchChannels();
      setChannels(channelList);
      setCurrentChannel(channelList[0]?.url); // Установить первый канал по умолчанию
    };

    loadChannels();
  }, []);

  const cashChannels = useMemo(() => {
    const arr = channels.filter((channel) =>
      channel.name.toLowerCase().includes(search.toLowerCase()),
    );
    return arr.length ? arr : channels;
  }, [search, channels]);

  useEffect(() => {
    if (currentChannel && videoRef.current) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls();
      hls.loadSource(currentChannel);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS.js error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error');
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    }
  }, [currentChannel]);

  return (
    <div>
      <h1>TV Channels</h1>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} />
      <div>
        {cashChannels.map((channel) => (
          <button
            key={channel.url}
            onClick={() => setCurrentChannel(channel.url)}
            style={{ margin: '5px' }}
          >
            {channel.name}
          </button>
        ))}
      </div>
      <video ref={videoRef} controls style={{ width: '100%' }} autoPlay />
    </div>
  );
};

export default Tv;
