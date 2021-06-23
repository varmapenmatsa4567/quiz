from re import L
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from random import choice
import string
from flask_login import LoginManager, UserMixin, login_user,logout_user, current_user, login_required

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///db.sqlite"
app.config['SECRET_KEY'] = 'jlsadkjfdofofsaldffjas'

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)

class User(UserMixin,db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    password = db.Column(db.String(100))

class Exname(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(6), unique=True)
    title = db.Column(db.String(100))
    username = db.Column(db.String(100))
    status = db.Column(db.Integer)
    nof = db.Column(db.Integer)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(6))
    title = db.Column(db.String(100))
    qno = db.Column(db.Integer)
    qsn = db.Column(db.String(500))
    o1 = db.Column(db.String(100))
    o2 = db.Column(db.String(100))
    o3 = db.Column(db.String(100))
    o4 = db.Column(db.String(100))
    ans = db.Column(db.Integer)

class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(6))
    title = db.Column(db.String(100))
    username = db.Column(db.String(100))
    marks = db.Column(db.Integer)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def welcome():
    return render_template("welcome.html")

@app.route('/login')
def login():
    return render_template("login.html")

@app.route('/signup')
def signup():
    return render_template("signup.html")

@app.route('/send', methods=['POST','GET'])
def send():
    username = request.form['username']
    pas1 = request.form['pswd1']
    pas2 = request.form['pswd2']
    user = User.query.filter_by(username=username).first()
    if user:
        flash("Username already Exists!!!")
        return redirect(url_for("signup"))
    elif pas1 != pas2:
        flash("Both Password Fields must be same!!!")
        return redirect(url_for("signup"))
    else:
        new_user = User(username=username,password=generate_password_hash(pas1))
        db.session.add(new_user)
        db.session.commit()
        flash("SignUp Successful!!!")
        return redirect(url_for("signup"))

@app.route('/verify', methods=['POST','GET'])
def verify():
    username = request.form['username']
    pswd = request.form['pswd']
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, pswd):
        login_user(user)
        return redirect(url_for('home'))
    flash("Please check your login details and try again.")
    return redirect(url_for("login"))

@app.route('/home')
@login_required
def home():
    return render_template("home.html")

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/teacher')
@login_required
def teacher():
    return render_template("teacher.html")

@app.route('/create')
@login_required
def create():
    return render_template('create.html')

@app.route('/crtqsns', methods=['POST','GET'])
@login_required
def crtqsns():
    title = request.form['title']
    nof = request.form['nof']
    code = getCode()
    username = current_user.username
    status = 0
    ex = Exname(username=username,code=code,title=title,status=status,nof=nof)
    db.session.add(ex)
    db.session.commit()
    return redirect(url_for('create'))

@app.route('/add')
@login_required
def add():
    return render_template('add.html',code=None)

@app.route('/checkcode', methods=['POST','GET'])
@login_required
def checkcode():
    code = request.form['code']
    ex = Exname.query.filter_by(code=code).first()
    if ex:
        return render_template('add.html',code=ex.code,title=ex.title,nof=ex.nof)
    return redirect(url_for('add'))

@app.route('/getqsns/<code>', methods=['POST','GET'])
@login_required
def getqsns(code):
    ex = Exname.query.filter_by(code=code).first()
    nof = ex.nof
    title = ex.title
    for i in range(1,nof+1):
        qsn = request.form['q'+str(i)]
        o1 = request.form[str(i)+'o1']
        o2 = request.form[str(i)+'o2']
        o3 = request.form[str(i)+'o3']
        o4 = request.form[str(i)+'o4']
        ans = request.form['c'+str(i)]
        q = Question(code=code,qno=i,title=title,qsn=qsn,o1=o1,o2=o2,o3=o3,o4=o4,ans=int(ans))
        db.session.add(q)
        db.session.commit()
    return redirect(url_for('add'))

@app.route('/status')
@login_required
def status():
    users = Exname.query.filter_by(username=current_user.username).order_by(Exname.status.desc()).all()

    return render_template('status.html', users=users)

@app.route('/update', methods=['POST','GET'])
@login_required
def update():
    code = request.form['code']
    stat = request.form['ch']
    q = Question.query.filter_by(code=code).first()
    print(stat)
    print(code)
    if stat == "Active" and q:
        print("sdkfjsdlkfjsdlkfjsdlkfj")
        status = 1
    else:
        status = 0
    ex = Exname.query.filter_by(code=code).first()
    ex.status = status
    db.session.commit()
    return redirect(url_for('status'))

@app.route('/student')
@login_required
def student():
    return render_template('student.html')

@app.route('/write')
@login_required
def write():
    return render_template('write.html', code=None)

@app.route('/sendqsns', methods=['POST','GET'])
@login_required
def sendqsns():
    code = request.form['code']
    ex = Exname.query.filter_by(code=code).first()
    us = Result.query.filter_by(code=code).filter_by(username=current_user.username).first()
    if ex and not us:
        if ex.status == 1:
            qs = Question.query.filter_by(code=code).all()
            return render_template('write.html',code=code,qns=qs,title=ex.title,nof=ex.nof)
    else:
        return render_template('write.html', code=None)

@app.route('/submit/<code>', methods=['POST','GET'])
@login_required
def submit(code):
    score = 0
    ex = Exname.query.filter_by(code=code).first()
    if ex.status == 1:
        nof = ex.nof
        for i in range(1,nof+1):
            a = request.form['a'+str(i)]
            an = Question.query.filter_by(code=code).filter_by(qno=i).first()
            if a == str(an.ans):
                score = score + 1

        print("Score is ",score)
        sc = Result(code=code,title=ex.title,username=current_user.username,marks=score)
        db.session.add(sc)
        db.session.commit()
    else:
        flash("This Exam is not Accepting Responses")
    return render_template('write.html', code=None)


def getCode():
    a = string.ascii_lowercase+string.digits+string.ascii_lowercase+string.digits
    c = ''.join([choice(a) for i in range(6)])
    code = Exname.query.filter_by(code=c).first()
    if code:
        return getCode()
    return c





if __name__ == "__main__":
    app.run()
