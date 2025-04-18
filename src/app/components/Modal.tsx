import React, { useState, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    imageUrls: string[];
    initialIndex: number;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, imageUrl, imageUrls, initialIndex }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex); // Update currentIndex when initialIndex changes
    }, [initialIndex]);

    if (!isOpen) return null;

    const handlePrevious = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 1 ? imageUrls.length - 1 : prevIndex - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex === imageUrls.length - 1 ? 1 : prevIndex + 1));
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <span className="close" onClick={onClose}>&times;</span>
                <button className="prev" onClick={handlePrevious}>&lt;</button>
                <img src={imageUrls[currentIndex]} alt="Full view" className="modal-content" />
                <button className="next" onClick={handleNext}>&gt;</button>
            </div>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .modal {
                    position: relative;
                    background: white;
                    padding: 10px;
                    border-radius: 8px;
                    max-width: 90%;
                    max-height: 90%;
                    overflow: hidden;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    font-size: 24px;
                    cursor: pointer;
                    background-color: rgba(255, 255, 255, 0.8);
                    padding: 5px;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);
                    z-index: 10;
                }
                .close:hover {
                    background-color: rgb(226 232 240);
                }
                .prev, .next {
                    background-color: rgba(255, 255, 255, 0.8);
                    border: none;
                    padding: 10px;
                    font-size: 24px;
                    cursor: pointer;
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    border-radius: 20%;
                    box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);
                    z-index: 10;
                }
                .prev {
                    left: 20px;
                }
                .next {
                    right: 20px;
                }
                .prev:hover, .next:hover {
                    background-color: rgb(226 232 240);
                }
                .modal-content {
                    display: block;
                    max-width: 100%;
                    max-height: calc(100vh - 60px);
                    margin: 0 auto;
                    border-radius: 8px;
                    z-index: 1;
                }
            `}</style>
        </div>
    );
};

export default Modal;
