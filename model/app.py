from flask import Flask,jsonify,request
from AI_save_image import detectObjects
from flask_ngrok import run_with_ngrok



#app=Flask(__name__)
app = Flask(__name__, static_url_path = "", static_folder = "C:/Users/Student/Desktop/Group2/model")

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
    img_path=img
    results=detectObjects(img_path)
    return jsonify(results)

run_with_ngrok(app)
if __name__ == "__main__":
    app.run()