from numpy.lib.type_check import _imag_dispatcher
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import numpy as np
import shutil
import requests
import cv2

def predLocation(imgURL):
    ## Set up the image URL and filename
    filename = imgURL.split("/")[-1]

    # Open the url image, set stream to True, this will return the stream content.
    r = requests.get(imgURL, stream = True)

    # Check if the image was retrieved successfully
    if r.status_code == 200:
        # Set decode_content value to True, otherwise the downloaded image file's size will be zero.
        r.raw.decode_content = True

        # Open a local file with wb ( write binary ) permission.
        
        with open('images/' + filename,'wb') as f:
            shutil.copyfileobj(r.raw, f)

            print('Image sucessfully Downloaded: ','images/'  + filename)
    else:
        print('Image Could not be retreived')
    
    image = cv2.imread('images/' + filename)
    image_height = image.shape[0]
    image_width = image.shape[1]

    if image_height >= image_width:
        bb = image_height
    else:
        bb = image_width

    aa = bb / 1000
    scale_percent = 30 # percent of original size
    width_0 = int(image.shape[1] * scale_percent / 100 / aa)
    height_0 = int(image.shape[0] * scale_percent / 100 / aa)
    dim = (width_0, height_0)
    image = cv2.resize(image, dim, interpolation=cv2.INTER_AREA)
    Img_Name_2 = 'images/' + filename 
    cv2.imwrite(Img_Name_2  , image)

    results = {}
    modelPath = r'C:\Users\Student\Desktop\project\project_code\damage_location_model.hdf5'
    imgPath = 'images/'+filename
    model = load_model(modelPath)
    img = load_img(imgPath, target_size=(256,256))
    img_arr = img_to_array(img)
    img_arr = img_arr.reshape((1,)+img_arr.shape)

    predResult = model.predict(img_arr)
    
    confidence = str((round(float(np.max(predResult)),4))*100)[:5]+'%'
    
    results['confidence']=confidence
    
    location = np.argmax(predResult)
    if location == 0:
        results['location'] = '車頭'
    elif location == 1:
        results['location'] = '引擎蓋或前車窗'
    elif location == 2:
        results['location'] = '車尾'
    elif location == 3:
        results['location'] = '車側身'
    elif location == 4:
        results['location'] = '行李箱蓋或後車窗'

    return results

if __name__ == '__main__':
    
    testImg = 'test_image/test1.jpg'
    print(predLocation(testImg))

    # location = np.argmax(predResult)
    # if location == 0:
    #     results['location'] = 'front'
    # elif location == 1:
    #     results['location'] = 'hood'
    # elif location == 2:
    #     results['location'] = 'rear'
    # elif location == 3:
    #     results['location'] = 'side'
    # elif location == 4:
    #     results['location'] = 'trunk'