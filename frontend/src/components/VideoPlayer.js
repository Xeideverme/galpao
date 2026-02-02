import React from 'react';
import ReactPlayer from 'react-player/youtube';

const VideoPlayer = ({ url, title }) => {
  if (!url) return null;
  
  // Verificar se é URL do YouTube válida
  const isValidYouTube = ReactPlayer.canPlay(url);
  
  if (!isValidYouTube) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">URL de vídeo inválida</p>
      </div>
    );
  }
  
  return (
    <div className="aspect-video rounded-lg overflow-hidden bg-black">
      <ReactPlayer
        url={url}
        width="100%"
        height="100%"
        controls
        light={true}
        playing={false}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              rel: 0
            }
          }
        }}
      />
      {title && (
        <p className="text-sm text-gray-600 mt-2">{title}</p>
      )}
    </div>
  );
};

export default VideoPlayer;
