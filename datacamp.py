import requests
import os

courses = [
    # ('Cluster Analysis in Python', '14739')
    ('Ensemble Methods in Python', 15296),
    ('Feature Engineering for NLP in Python', 16570),
    ('Winning a Kaggle Competition in Python', 16839),
    ('Sentiment Analysis in Python', 16852),
    ('Image Processing in Python', 16921),
    ('Recurrent Neural Networks for Language Modeling in Python', 17591),
    ('Practicing Machine Learning Interview Questions in Python', 19853),
    ('Natural Language Generation in Python', 21406),
    ('Statistical Thinking in Python (Part 1)', 1549),
    ('Statistical Thinking in Python (Part 2)', 1550),
    ('Foundations of Probability in R', 2351),
    ('Foundations of Probability in Python', 14568),
    ('Practicing Statistics Interview Questions in Python', 16463),
    ('Practicing Coding Interview Questions in Python', 16327),
    ('Advanced Deep Learning with Keras', 6554),
    ('Image Processing with Keras in Python', 7823)

]

parent = '/Volumes/Samsung_T5/datacamp/temp'

for name, id in courses:
    path = os.path.join(parent, name)
    os.mkdir(path)
    for chapter in ['1', '2', '3', '4']:
        print(f'processing {name}')
        f = open(f'{parent}/{name}/chapter{chapter}.pdf', 'wb')
        f.write(requests.get(f'https://s3.amazonaws.com/assets.datacamp.com/production/course_{id}/slides/chapter{chapter}.pdf').content)
        f.close()
