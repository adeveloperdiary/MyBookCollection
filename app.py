from flask import Flask, request, send_from_directory, render_template, jsonify
import json
import requests
import pprint
from bs4 import BeautifulSoup
import uuid
import base64

app = Flask(__name__)

books = list()


@app.route('/')
def root():
    global books
    with open("data/books.json") as file:
        books = json.loads(file.read())

    with open("data/categories.json", 'r') as file:
        cats = json.loads(file.read())

    cat_count = list()
    for cat in cats:
        if cat in books:
            count = len(books[cat])
            cat_count.append((cat, count))
        else:
            cat_count.append((cat, 0))
    return render_template('index.html', cats=cat_count, project_count=get_project_count())


@app.route('/get_books')
def get_books():
    cat = request.args.get('cat')
    selected_books = []
    if cat in books:
        for book in books[cat]:
            chapters = book['chapters']
            progress = 0

            if len(chapters) > 0:
                for chapter in chapters:
                    if chapter['completed']:
                        progress += 1

                book['progress'] = progress * 100 / len(chapters)
            else:
                book['progress'] = progress
            selected_books.append(book)
    return jsonify(selected_books)


@app.route('/get_queue')
def get_queue():
    selected_books = []
    for id in books['Queue']:
        for book_list in books.values():
            for book in book_list:
                if type(book) is not str and book['id'] == id:
                    chapters = book['chapters']
                    progress = 0
                    if len(chapters) > 0:
                        for chapter in chapters:
                            if chapter['completed']:
                                progress += 1
                        book['progress'] = progress * 100 / len(chapters)
                    else:
                        book['progress'] = progress
                    selected_books.append(book)
                    break
    return jsonify(selected_books)


@app.route('/save_chapters', methods=['POST'])
def save_chapters():
    global books

    with open("data/books.json") as file:
        books = json.loads(file.read())

    chapters = request.json

    cat = request.args.get('cat')
    id = request.args.get('id')

    for book in books[cat]:
        if book['id'] == id:
            book['chapters'] = chapters

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/save_rating', methods=['POST'])
def save_rating():
    global books

    with open("data/books.json") as file:
        books = json.loads(file.read())

    cat = request.args.get('cat')
    id = request.args.get('id')

    if request.args.get('rating') == 'false':
        rating = False
    else:
        rating = True

    for book in books[cat]:
        if book['id'] == id:
            book['rating'] = rating

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/save_queue', methods=['POST'])
def save_queue():
    global books

    with open("data/books.json") as file:
        books = json.loads(file.read())

    id = request.args.get('id')
    if 'Queue' in books:
        if id not in books['Queue']:
            books['Queue'].append(id)
    else:
        books['Queue'] = [id]

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/remove_queue', methods=['POST'])
def remove_queue():
    global books

    with open("data/books.json") as file:
        books = json.loads(file.read())

    id = request.args.get('id')

    if id in books['Queue']:
        books['Queue'].remove(id)

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/save_tags', methods=['POST'])
def save_tags():
    global books

    with open("data/books.json") as file:
        books = json.loads(file.read())

    cat = request.args.get('cat')
    id = request.args.get('id')
    tags = request.args.get('tags').split(',')

    for book in books[cat]:
        if book['id'] == id:
            book['tags'].extend(tags)

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/save_notes', methods=['POST'])
def save_notes():
    global books

    with open("data/books.json") as file:
        books = json.loads(file.read())

    cat = request.args.get('cat')
    id = request.args.get('id')
    notes = request.args.get('notes')

    for book in books[cat]:
        if book['id'] == id:
            book['notes'] = notes

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/fetch_manning')
def fetch_manning_book_details():
    global books

    cat = request.args.get('cat')
    url = request.args.get('url')

    url = base64.b64decode(url)

    page = requests.get(url)
    soup = BeautifulSoup(page.content, 'html.parser')
    result = soup.find('div', class_='product-title')
    title = result.text.strip()

    image = soup.find('div', class_='product-thumbnail')
    image_name = str(uuid.uuid4())
    if image is not None:
        image = image.attrs['style']
        image = image.split("'")[-2]

        f = open(f'static/book_covers/{image_name}.jpg', 'wb')
        f.write(requests.get(image).content)
        f.close()

    results = soup.find('div', {'class': 'toc'})
    results = results.find_all('h2')
    chapters = list()
    for result in results:
        # t = result.text.split(" ")[1:]

        d = {
            'name': result.text,
            'completed': False
        }
        chapters.append(d)

    book = {
        "id": image_name,
        "title": title,
        "category": cat,
        "image_name": f'{image_name}.jpg',
        "url": url.decode(),
        "rating": False,
        "tags": [
        ],
        "notes": "",
        "chapters": chapters
    }

    with open("data/books.json") as file:
        books = json.loads(file.read())

    if cat in books:
        books[cat].append(book)
    else:
        books[cat] = [book]

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/fetch_amazon')
def fetch_amazon_book_details():
    global books

    cat = request.args.get('cat')
    url = request.args.get('url')

    url = base64.b64decode(url)

    headers = {
        'dnt': '1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'referer': 'https://www.amazon.com/',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    }

    r = requests.get(url, headers=headers)
    # Simple check to check if page was blocked (Usually 503)

    soup = BeautifulSoup(r.content, 'html.parser')
    title = soup.find('span', {'id': 'productTitle'}).text

    image = soup.select('#imgBlkFront')[0].get('data-a-dynamic-image')

    image_path = image.split('"')[1]
    image_name = str(uuid.uuid4())
    f = open(f'static/book_covers/{image_name}.jpg', 'wb')
    f.write(requests.get(image_path).content)
    f.close()

    book = {
        "id": image_name,
        "title": title,
        "category": cat,
        "image_name": f'{image_name}.jpg',
        "url": url.decode(),
        "rating": False,
        "tags": [
        ],
        "notes": "",
        "chapters": []
    }

    with open("data/books.json") as file:
        books = json.loads(file.read())

    if cat in books:
        books[cat].append(book)
    else:
        books[cat] = [book]

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/fetch_oreilly')
def fetch_oreilly_book_details():
    global books

    cat = request.args.get('cat')
    url = request.args.get('url')

    url = base64.b64decode(url)
    page = requests.get(url)
    soup = BeautifulSoup(page.content, 'html.parser')

    title = soup.find('h1', {'class': 't-title'})

    image_path = soup.find('img', {'class': 't-cover-img'}).get('src')

    image_name = str(uuid.uuid4())
    f = open(f'static/book_covers/{image_name}.jpg', 'wb')
    f.write(requests.get(image_path).content)
    f.close()

    tocs = soup.find('ol', {'class': 'detail-toc'})
    tocs = tocs.find_all('li', {'class': 'toc-level-1'})

    chapters = list()
    for toc in tocs:
        d = {
            'name': toc.find('a', text=True, recursive=False).text,
            'completed': False
        }
        chapters.append(d)

    book = {
        "id": image_name,
        "title": title.text,
        "category": cat,
        "image_name": f'{image_name}.jpg',
        "url": url.decode(),
        "rating": False,
        "tags": [
        ],
        "notes": "",
        "chapters": chapters
    }

    with open("data/books.json") as file:
        books = json.loads(file.read())

    if cat in books:
        books[cat].append(book)
    else:
        books[cat] = [book]

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/fetch_barnesandnoble')
def fetch_barnesandnoble_book_details():
    global books

    cat = request.args.get('cat')
    url = request.args.get('url')

    url = base64.b64decode(url)

    headers = {
        'dnt': '1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'sec-fetch-dest': 'document',
        'referer': 'https://www.amazon.com/',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    }

    page = requests.get(url, headers=headers)

    soup = BeautifulSoup(page.content, 'html.parser')

    title = soup.find('h1', {'class': 'pdp-header-title'})

    image_path = 'http:' + soup.find('img', {'id': 'pdpMainImage'}).get('src')
    print(image_path)
    image_name = str(uuid.uuid4())
    f = open(f'static/book_covers/{image_name}.jpg', 'wb')
    f.write(requests.get(image_path).content)
    f.close()

    toc = soup.find('div', {'class': 'table-of-contents'}).find_all('p')

    if toc is None or len(toc) == 0:
        toc = soup.find('div', {'class': 'table-of-contents'}).findAll(text=True, recursive=False)[1]
        topics = toc.split('-')
    elif len(toc) < 2:
        toc = soup.find('div', {'class': 'table-of-contents'}).find('p')
        toc = toc.text
        topics = toc.split('-')
    else:
        topics = []
        for t in toc:
            topics.append(t.text)

    chapters = list()
    for toc in topics:
        for t in toc.split(':'):
            if t is not "":
                d = {
                    'name': toc,
                    'completed': False
                }
                chapters.append(d)

    book = {
        "id": image_name,
        "title": title.text,
        "category": cat,
        "image_name": f'{image_name}.jpg',
        "url": url.decode(),
        "rating": False,
        "tags": [
        ],
        "notes": "",
        "chapters": chapters
    }

    with open("data/books.json") as file:
        books = json.loads(file.read())

    if cat in books:
        books[cat].append(book)
    else:
        books[cat] = [book]

    with open("data/books.json", 'w+') as file:
        json.dump(books, file, indent=4)

    return '{"result":"success"}'


@app.route('/projects_and_tasks')
def projects_and_tasks():
    with open("data/projects.json") as file:
        projects = json.loads(file.read())

    output = list()

    goal = request.args.get('goal')

    for project_key in projects.keys():

        tasks = list()
        project = projects[project_key]
        for task_key in projects[project_key]['tasks'].keys():
            task = projects[project_key]['tasks'][task_key]
            task['id'] = task_key
            tasks.append(task)

        project['tasks'] = tasks
        project['id'] = project_key
        if goal is None and ('goal' not in project or 'goal' in project and project['goal'] == ""):
            output.append(project)
        elif 'goal' in project and project['goal'] == goal:
            output.append(project)
    return jsonify(output)


@app.route('/new_project')
def create_new_project():
    with open("data/projects.json") as file:
        projects = json.loads(file.read())

    name = request.args.get('name')
    goal = request.args.get('goal')
    color = request.args.get('color')

    if goal is None:
        goal = ""

    project = {
        "name": name,
        "color": f'#{color}',
        "goal": goal,
        "tasks": {}
    }

    projects[str(uuid.uuid4())] = project

    with open("data/projects.json", 'w+') as file:
        json.dump(projects, file, indent=4)

    return '{"result":"success"}'


@app.route('/remove_project')
def remove_project():
    with open("data/projects.json") as file:
        projects = json.loads(file.read())

    id = request.args.get('id')

    del projects[id]

    with open("data/projects.json", 'w+') as file:
        json.dump(projects, file, indent=4)

    return '{"result":"success"}'


@app.route('/add_task')
def add_task():
    with open("data/projects.json") as file:
        projects = json.loads(file.read())

    task_name = request.args.get('name')
    project_id = request.args.get('id')

    for project_key in projects.keys():
        if project_key == project_id:
            projects[project_key]['tasks'][str(uuid.uuid4())] = {
                "name": task_name,
                "completed": False
            }

    with open("data/projects.json", 'w+') as file:
        json.dump(projects, file, indent=4)

    return '{"result":"success"}'


@app.route('/complete_task')
def complete_task():
    with open("data/projects.json") as file:
        projects = json.loads(file.read())

    task_id = request.args.get('task_id')
    project_id = request.args.get('project_id')
    status = request.args.get('status')

    if status == "false":
        status = False
    else:
        status = True

    for project_key in projects.keys():
        if project_key == project_id:
            for task_key in projects[project_key]['tasks'].keys():
                if task_key == task_id:
                    projects[project_key]['tasks'][task_key]['completed'] = status

    with open("data/projects.json", 'w+') as file:
        json.dump(projects, file, indent=4)

    return '{"result":"success"}'


@app.route('/delete_task')
def delete_task():
    with open("data/projects.json") as file:
        projects = json.loads(file.read())

    task_id = request.args.get('task_id')
    project_id = request.args.get('project_id')

    for project_key in projects.keys():
        if project_key == project_id:
            for task_key in projects[project_key]['tasks'].keys():
                if task_key == task_id:
                    del projects[project_key]['tasks'][task_key]
                    break

    with open("data/projects.json", 'w+') as file:
        json.dump(projects, file, indent=4)

    return '{"result":"success"}'


def get_project_count():
    with open("data/projects.json") as file:
        projects = json.loads(file.read())

    return len(projects)


@app.route('/save_plan', methods=['POST'])
def save_plan():
    with open("data/planning.json", 'w+') as file:
        json.dump(request.json, file, indent=4)

    return '{"result":"success"}'


@app.route('/get_plan')
def get_plan():
    with open("data/planning.json", 'r') as file:
        return jsonify(json.loads(file.read()))


if __name__ == '__main__':
    app.run()
