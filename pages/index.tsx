require('dotenv').config()
import { FaGithub, FaQuestionCircle, FaLink, FaLifeRing, FaTwitter } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import { CircularProgress, Button } from '@material-ui/core';



const prohibitedWords = ['nude', 'naked', 'pussy'];
const ProdiaKeyModal = ({ setProdiaKey, setShowProdiaKeyModal }) => {
  const [key, setKey] = useState('');

  const handleInputChange = (e) => {
    setKey(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('PRODIA_KEY', key);
    setProdiaKey(key);
    setShowProdiaKeyModal(false);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '1000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'opacity 0.3s ease',
      }}
    >
      <form 
        onSubmit={handleSubmit} 
        style={{
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          width: '50%', 
          maxWidth: '600px'  // Prevent the modal from getting too wide on large screens
        }}
      >
        <h2>Prodia Key</h2>
        <p>You can obtain a Prodia key from the official Pixio website. Register for an account and follow the instructions to obtain your key.</p>
        <label style={{display: 'block', marginBottom: '10px'}}>
          Key:
          <input 
            type="text" 
            value={key} 
            onChange={handleInputChange} 
            required 
            style={{
              width: '100%',
              padding: '12px 20px',
              margin: '8px 0',
              boxSizing: 'border-box',
              border: '2px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#f8f8f8',
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            margin: '4px 2px',
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
};


  
export default function HomePage() {
  const [prodiaKey, setProdiaKey] = useState('');
  const [showProdiaKeyModal, setShowProdiaKeyModal] = useState(true); // Add this line
  useEffect(() => {
    const storedKey = localStorage.getItem('PRODIA_KEY');
    console.log('Stored key:', storedKey); // Add this line
    if (storedKey) {
      setProdiaKey(storedKey);
      setShowProdiaKeyModal(false);
    } else {
      const envKey = process.env.PRODIA_KEY;
      console.log('Env key:', envKey); // And this line
      if (envKey) {
        setProdiaKey(envKey);
        setShowProdiaKeyModal(false);
      }
    }
  }, []);
  
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const [aspect_ratio, setaspect_ratio] = useState('');
  const [sampler, setSampler] = useState('');
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [buttonText, setButtonText] = useState('Generate Images');
  const toggleModelSelection = (model) => {
    if (selectedModels.includes(model)) {
      setSelectedModels(selectedModels.filter(selectedModel => selectedModel !== model));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const modelMap = {
    'Absolute Reality 1.6': 'absolutereality_V16.safetensors [37db0fc3]', 
    'Absolute Reality 1.8': 'absolutereality_v181.safetensors [3d9d4d2b]',
    'Analog Diffusion v1.0': 'analog-diffusion-1.0.ckpt [9ca13f02]',
    'Anything v5': 'anythingV5_PrtRE.safetensors [893e49b9]',
    'Anything v3.0': 'anythingv3_0-pruned.ckpt [2700c435]',
    'Anything v4.5': 'anything-v4.5-pruned.ckpt [65745d25]',
    'Deliberate v2': 'deliberate_v2.safetensors [10ec4b29]',
    'Dreamshaper 7': 'dreamshaper_7.safetensors [5cf5ae06]',
    'Dreamlike Diffusion 1.0': 'dreamlike-diffusion-1.0.safetensors [5c9fd6e0]',
    'Dreamlike Diffusion 2.0': 'dreamlike-diffusion-2.0.safetensors [fdcf65e7]',
    'Dreamshaper 8': 'dreamshaper_8.safetensors [9d40847d]',
    'Dreamshaper 6 BakedVae': 'dreamshaper_6BakedVae.safetensors [114c8abb]',
    'Eimis Anime Diffusion': 'EimisAnimeDiffusion_V1.ckpt [4f828a15]',
    'Elddreths Vivid Mix': 'elldreths-vivid-mix.safetensors [342d9d26]',
    'Lyriel v16': 'lyriel_v16.safetensors [68fceea2]',
    'Meinamix MeinaV9': 'meinamix_meinaV9.safetensors [2ec66ab0]',
    'meinamix meinaV11': 'meinamix_meinaV11.safetensors [b56ce717]',   
    'mechamix V1': 'mechamix_v10.safetensors [ee685731]',
    'Openjourney V4': 'openjourney_V4.ckpt [ca2f377f]',
    'Orange Mix AOM3A3': 'AOM3A3_orangemixs.safetensors [9600da17]',
    'portraitplus V1.0': 'portraitplus_V1.0.safetensors [1400e684]',
    'Realistic Vision v1.4': 'Realistic_Vision_V1.4-pruned-fp16.safetensors [8d21810b]',
    'Realistic Vision V4.0': 'Realistic_Vision_V4.0.safetensors [29a7afaa]',
    'Realistic Vision V5.0': 'Realistic_Vision_V5.0.safetensors [614d1063]',
    'redshift diffusion V10': 'redshift_diffusion-V10.safetensors [1400e684]',
    'Rev Animated v122': 'revAnimated_v122.safetensors [3f4fefd9]',
    'SD 1.4': 'sdv1_4.ckpt [7460a6fa]',
    'SD 1.5': 'v1-5-pruned-emaonly.ckpt [81761151]',
    'Shonins Beautiful v10': 'shoninsBeautiful_v10.safetensors [25d8c546]',
    'Theallys Mix II Churned': 'theallys-mix-ii-churned.safetensors [5d9225a4]',
    'Timeless 1.0': 'timeless-1.0.ckpt [7c4971d4]',
    };
    
  const models = Object.keys(modelMap);

  const toggleSelectAllImages = () => {
    const areAllSelected = imageUrls.every((image) => image.selected);
    const updatedImageUrls = imageUrls.map((image) => ({ ...image, selected: !areAllSelected }));
    setImageUrls(updatedImageUrls);
  };
  

  const handleGenerateImage = async () => {
    setButtonText('Loading...');
    setLoading(true);
    setError(null);

    // Perform prompt moderation
    const isPromptSafe = performPromptModeration(prompt);
    const isNegativePromptSafe = performPromptModeration(negativePrompt);
    if (!isPromptSafe || !isNegativePromptSafe) {
      setError('The prompt or negative prompt contains inappropriate content. Please revise your input.');
      setLoading(false);
      setButtonText('Generate Image');
      return;
    }

    try {
      const newImageUrls = [];
      for (const model of selectedModels) {
        const response = await axios.post('/api/generateImage', {
          prompt,
          negativePrompt,
          model: modelMap[model],
          upscale: false,
          aspect_ratio, // add this line
          sampler, // and this line
          prodiaKey, // Add this line
        });

        const imageUrl = response.data.imageUrl;
        newImageUrls.push({ imageUrl, selected: false });
      }
      setImageUrls(newImageUrls);
    } catch (error) {
      // Check if error is a rate limit error
      if (error.response && error.response.status === 429) {
        setError('You have exceeded the rate limit. Please try again later.');
      } else {
        setError('There was a problem generating the image. Please try again.');
      }
    } finally {
      setLoading(false);
      setButtonText('Generate Image');
    }
  };

  // Perform prompt moderation
  const performPromptModeration = (text) => {
    const words = text.toLowerCase().split(' ');

    for (const word of words) {
      if (prohibitedWords.includes(word)) {
        return false; // Prompt contains prohibited word
      }
    }

    return true; // Prompt is safe
  };
  
  const handleSendToDiscord = async () => {
    const selectedImageUrls = imageUrls.filter((image) => image.selected).map((image) => image.imageUrl);
    if (selectedImageUrls.length === 0) {
      return;
    }
    try {
      for (const imageUrl of selectedImageUrls) {
        await axios.post('/api/postToDiscord', { message: prompt, imageUrl });
      }
    } catch (error) {
      setError('There was a problem sending the image to Discord. Please try again.');
    }
  };

  const handleOpenLightbox = (index) => {
    setLightboxOpen(true);
    setLightboxIndex(index);
  };
  const selectAllModels = () => {
    setSelectedModels(models);
  };
  const handleToggleImageSelection = (index) => {
    const updatedImageUrls = [...imageUrls];
    updatedImageUrls[index].selected = !updatedImageUrls[index].selected;
    setImageUrls(updatedImageUrls);
    if (lightboxOpen && updatedImageUrls[index].selected) {
      setLightboxOpen(false);
    }
  };

  return (
    <div className="flex flex-col items-start min-h-screen w-full py-0"> {/* Removed py-2 */}
  
      {showProdiaKeyModal && <ProdiaKeyModal setProdiaKey={setProdiaKey} setShowProdiaKeyModal={setShowProdiaKeyModal} />} 
  
      <header className="w-full p-4 mb-4 bg-gray-800 text-white flex justify-around">
      {/* Icons */}
        <a href="https://github.com/Tech-in-Schools-Inititaitive/pixio-community-lite-edition" target="_blank" rel="noopener noreferrer">
          <FaGithub size={24} />
        </a>
        <a href="https://docs-three-jet.vercel.app/" target="_blank" rel="noopener noreferrer">
          <FaQuestionCircle size={24} />
        </a>
        <a href="https://pixio.myapps.ai" target="_blank" rel="noopener noreferrer">
          <FaLink size={24} />
        </a>
        <a href="https://myapps.ai" target="_blank" rel="noopener noreferrer">
          <FaLifeRing size={24} />
        </a>
        <a href="https://x.com/tsi_org" target="_blank" rel="noopener noreferrer">
          <FaTwitter size={24} />
        </a>
      </header>
  
      <div className="flex flex-col lg:flex-row w-full">
        {/* Left Side (UI/UX Inputs) */}
        <div className="w-3/10 pr-2">
        <h1 className="text-4xl font-bold mb-8 text-center">👀Pixio</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <div className="flex flex-wrap justify-center w-full">
            <div className="bg-white shadow-md rounded-lg p-6 w-full md:max-w-md mb-8">
              {/* Prompt Input */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prompt">
                  Prompt
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Enter your prompt"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="prompt"
                />
              </div>
  
              {/* Negative Prompt Input */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="negative-prompt">
                  Negative Prompt
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="Enter your negative prompt"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="negative-prompt"
                />
              </div>
  
              {/* Model Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="models">
                  Models
                </label>
                <div className="flex flex-wrap">
                <Button
            variant="outlined"
            color="primary"
            onClick={selectAllModels}
            className="m-1"
          >
            Select All
          </Button>
                  {models.map((model) => (
                    <Button
                      key={model}
                      variant={selectedModels.includes(model) ? "contained" : "outlined"}
                      color={selectedModels.includes(model) ? "primary" : "default"}
                      onClick={() => toggleModelSelection(model)}
                      className="m-1"
                    >
                      {model}
                    </Button>
                  ))}
                </div>
              </div>
  
              {/* Aspect Ratio and Sampler Inputs */}
              <div className="flex justify-between mb-4">
                <div className="w-1/2 pr-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="aspect-ratio">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspect_ratio}
                    onChange={(event) => setaspect_ratio(event.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="aspect-ratio"
                  >
                    <option value="square">square</option>
                    <option value="portrait">portrait</option>
                    <option value="landscape">landscape</option>
                  </select>
                </div>
                <div className="w-1/2 pl-2">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sampler">
                    Sampler
                  </label>
                  <select
                    value={sampler}
                    onChange={(event) => setSampler(event.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="sampler"
                  >
                    <option value="DDIM">DDIM</option>
                    <option value="Heun">Heun</option>
                    <option value="Euler">Euler</option>
                    <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
                  </select>
                </div>
              </div>
  
              {/* Generation and Gallery Buttons */}
              <button
                onClick={handleGenerateImage}
                disabled={loading}
                className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline relative"
              >
                {loading && (
                  <CircularProgress
                    size={24}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                )}
                Generate Image
              </button>
  
              <button
                onClick={handleSendToDiscord}
                disabled={imageUrls.every((image) => !image.selected)}
                className="mt-4 w-full bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 focus:outline-none focus:shadow-outline"
              >
                Send to Gallery
              </button>
  
              <button
                onClick={toggleSelectAllImages}
                className="mt-4 w-full bg-orange-600 text-white font-bold py-2 px-4 rounded hover:bg-orange-700 focus:outline-none focus:shadow-outline"
              >
                Toggle Select All Images
              </button>
  
              <button className="mt-4 w-full bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 focus:outline-none focus:shadow-outline">
                <a href="/gallery" className="block text-center">
                  View Gallery (Coming Soon)
                </a>
              </button>
  
              <button className="mt-4 w-full bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 focus:outline-none focus:shadow-outline">
                <a href="/gallery" className="block text-center">
                  Prompt Builder (Coming Soon)
                </a>
              </button>
            </div>
          </div>
        </div>
  
{/* Right Side (Image Gallery) */}
<div className="w-full lg:w-7/10 pl-2 lg:pl-0 pr-6"> {/* Added right padding */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6 lg:gap-8">
    {imageUrls.map((image, index) => (
      <div
        key={index}
        className={`relative rounded-lg overflow-hidden cursor-pointer ${image.selected ? 'border-2 border-blue-500' : ''}`}
        onClick={() => handleOpenLightbox(index)}
      >
        <div style={{ paddingBottom: '100%' }} className="relative">
          <img src={image.imageUrl} alt="Generated image" className="absolute w-full h-full object-cover top-0 left-0" />
          {/* <div className="absolute top-2 right-2">
            <input
              type="checkbox"
              checked={image.selected}
              onChange={() => handleToggleImageSelection(index)}
              className="m-2"
            />
          </div> */}
        </div>
      </div>
    ))}
  </div>




          {lightboxOpen && (
            <Lightbox
              mainSrc={imageUrls[lightboxIndex].imageUrl}
              nextSrc={imageUrls[(lightboxIndex + 1) % imageUrls.length].imageUrl}
              prevSrc={imageUrls[(lightboxIndex + imageUrls.length - 1) % imageUrls.length].imageUrl}
              onCloseRequest={() => setLightboxOpen(false)}
              onMovePrevRequest={() => setLightboxIndex((lightboxIndex + imageUrls.length - 1) % imageUrls.length)}
              onMoveNextRequest={() => setLightboxIndex((lightboxIndex + 1) % imageUrls.length)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
