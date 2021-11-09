from flask import Flask,jsonify,request
from damage_location import predLocation
from flask_ngrok import run_with_ngrok
import json



#app=Flask(__name__)
app = Flask(__name__, static_url_path = "", static_folder = r"C:\Users\Student\Desktop\project\project_code")
app.config['JSON_AS_ASCII'] = False
# import os
# from flask import send_from_directory

# @app.route('/favicon.ico')
# def favicon():
#     return send_from_directory(os.path.join(app.root_path, 'static'),
#                                'favicon.ico', mimetype='images/favicon.ico')


@app.route('/')
def detect():
    img=request.args['image']
    # img_path='images/'+img
    imagePath=img

    results=predLocation(imagePath)
    # return jsonify(results)
    return json.dumps(results,ensure_ascii=False)

run_with_ngrok(app)
if __name__ == "__main__":
    app.run()