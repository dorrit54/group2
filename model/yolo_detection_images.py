import numpy as np
import cv2
import os
import requests
import shutil


def detectObjects(img_path):


    ## Set up the image URL and filename
    image_url = img_path
    filename = image_url.split("/")[-1]
    #filename = 'images/9999.jpg'
    # Open the url image, set stream to True, this will return the stream content.
    r = requests.get(image_url, stream = True)

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



    # confidenceThreshold = 0.5
    # NMSThreshold = 0.3

    # modelConfiguration = 'cfg/my_yolov3.cfg'
    # modelWeights = 'C:/Users/Student/Desktop/test_flask/YOLO-v3-Object-Detection/weights/yolov3_last.weights'

    # labelsPath = 'obj.names'
    # labels = open(labelsPath).read().strip().split('\n')

    # np.random.seed(10)
    # COLORS = np.random.randint(0, 255, size=(len(labels), 3), dtype="uint8")

    # net = cv2.dnn.readNetFromDarknet(modelConfiguration, modelWeights)

    # image = cv2.imread(img_path)
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
    # (H, W) = image.shape[:2] 


    # if image_height or image_width > 2000:
    #     scale_percent = 30 # percent of original size
    #     width_0 = int(image.shape[1] * scale_percent/100)
    #     height_0 = int(image.shape[0] * scale_percent/100)
    #     dim = (width_0, height_0)
    #     image = cv2.resize(image, dim, interpolation=cv2.INTER_AREA)
    #     (H, W) = image.shape[:2] 
    # else:
    #     scale_percent = 60 # percent of original size
    #     width_0 = int(image.shape[1] * scale_percent/100)
    #     height_0 = int(image.shape[0] * scale_percent/100)
    #     dim = (width_0, height_0)
    #     image = cv2.resize(image, dim, interpolation=cv2.INTER_AREA)
    #     (H, W) = image.shape[:2] 

    #Determine output layer names
    # layerName = net.getLayerNames()
    # layerName = [layerName[i[0] - 1] for i in net.getUnconnectedOutLayers()]

    # blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416), swapRB = True, crop = False)
    # net.setInput(blob)
    # layersOutputs = net.forward(layerName)

    # boxes = []
    # confidences = []
    # classIDs = []

    # for output in layersOutputs:
    #     for detection in output:
    #         scores = detection[5:]
    #         classID = np.argmax(scores)
    #         confidence = scores[classID]
    #         if confidence > confidenceThreshold:
    #             box = detection[0:4] * np.array([W, H, W, H])
    #             (centerX, centerY,  width, height) = box.astype('int')
    #             x = int(centerX - (width/2))
    #             y = int(centerY - (height/2))

    #             boxes.append([x, y, int(width), int(height)])
    #             confidences.append(float(confidence))
    #             classIDs.append(classID)

    # #Apply Non Maxima Suppression
    # detectionNMS = cv2.dnn.NMSBoxes(boxes, confidences, confidenceThreshold, NMSThreshold)

    # outputs ={}

    # if len(detectionNMS)>0:
    #     outputs['detections']={}
    #     outputs['detections']['labels']=[]
    #     for i in detectionNMS.flatten():
    #         (x, y) = (boxes[i][0], boxes[i][1])
    #         (w, h) = (boxes[i][2], boxes[i][3])

    #         color = [int(c) for c in COLORS[classIDs[i]]]
    #         cv2.rectangle(image, (x, y), (x + w, y + h), color, 2)
    #         text = '{}: {:.4f}'.format(labels[classIDs[i]], confidences[i])
    #         cv2.putText(image, text, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    #         detection={}
    #         detection['label']=labels[classIDs[i]]
    #         detection['confidence']=confidences[i]
    #         outputs['detections']['labels'].append(detection)

    #     Img_Name = 'images/' + "output_" + filename 
    #     cv2.imwrite(Img_Name  , image)

    # else:
    #     outputs['detections']='No object detected'
    # return outputs

    if len(detectionNMS)>0:
        outputs['detections']={}
        outputs['detections']['labels']=[]

    else:
        outputs['detections']='No object detected'
    return outputs 