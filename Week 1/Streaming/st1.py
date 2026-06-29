import time

# def numbers():
#     for i in range(5):
#         yield i

# for num in numbers():
#     time.sleep(1)
#     print(num)
   
for i in range(5):
    time.sleep(1)
    print(i, flush=True)