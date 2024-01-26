import React from 'react' 
import CustomDialogTrigger from '../global/custom-dialog-trigger';
import BannerUploadForm from './banner-upload-form';

interface BannerUploadProps {
    children: React.ReactNode;
    className?: string;
    dirType: 'workspace' | 'file' | 'folder';
    id: string;
  }

const BannerUpload = ({ children, className, dirType, id }: BannerUploadProps) => {
  return (
    <CustomDialogTrigger header='Upload Banner' content={<BannerUploadForm dirType={dirType} id={id}/>} 
    className={className}>
        {children}
    </CustomDialogTrigger>
  )
}

export default BannerUpload