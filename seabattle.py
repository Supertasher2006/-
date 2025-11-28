from tkinter import *
import random
root = Tk()     # создаем корневой объект - окно
root.title("Приложение на Tkinter")     # устанавливаем заголовок окна
root.geometry("600x750")    # устанавливаем размеры окна
def hide_ship1():
    global ships
    ships+=1
    ship1.place(x=-300, y=-100, anchor=CENTER)

def hide_ship2():
    global ships
    ships += 1
    ship2.place(x=-300, y=-100, anchor=CENTER)

def hide_ship3():
    global ships
    ships += 1
    ship22.place(x=-300, y=-100, anchor=CENTER)

def hide_ship4():
    global ships
    ships += 1
    ship3.place(x=-300, y=-100, anchor=CENTER)

def hide_ship5():
    global ships
    ships += 1
    ship32.place(x=-300, y=-100, anchor=CENTER)

def hide_ship6():
    global ships
    ships += 1
    ship33.place(x=-300, y=-100, anchor=CENTER)

def hide_ship7():
    global ships
    ships += 1
    ship4.place(x=-300, y=-100, anchor=CENTER)

def hide_ship8():
    global ships
    ships += 1
    ship42.place(x=-300, y=-100, anchor=CENTER)

def hide_ship9():
    global ships
    ships += 1
    ship43.place(x=-300, y=-100, anchor=CENTER)

def hide_ship10():
    global ships
    ships += 1
    ship44.place(x=-300, y=-100, anchor=CENTER)

def hide_ship():
    ship1.place(x=-300, y=-100, anchor=CENTER)
    ship2.place(x=-300, y=-200, anchor=CENTER)
    ship22.place(x=-300, y=-300, anchor=CENTER)
    ship3.place(x=-400, y=-100, anchor=CENTER)
    ship32.place(x=-400, y=-200, anchor=CENTER)
    ship33.place(x=-400, y=-300, anchor=CENTER)
    ship4.place(x=-300, y=-400, anchor=CENTER)
    ship42.place(x=-400, y=-400, anchor=CENTER)
    ship43.place(x=-300, y=-500, anchor=CENTER)
    ship44.place(x=-400, y=-500, anchor=CENTER)
    ready3.place(x=-100, y=-50)
    ready.place(x=-100, y=-50)
    ready2.place(x=-100, y=-50)
    turn.place(x=-100, y=-50)

def show_ship():
    ship1.place(x=300, y=100, anchor=CENTER)
    ship2.place(x=300, y=200, anchor=CENTER)
    ship22.place(x=300, y=300, anchor=CENTER)
    ship3.place(x=400, y=100, anchor=CENTER)
    ship32.place(x=400, y=200, anchor=CENTER)
    ship33.place(x=400, y=300, anchor=CENTER)
    ship4.place(x=300, y=400, anchor=CENTER)
    ship42.place(x=400, y=400, anchor=CENTER)
    ship43.place(x=300, y=500, anchor=CENTER)
    ship44.place(x=400, y=500, anchor=CENTER)

def computer():
    coordinates.clear()
    for i in range(10):
        for j in range(10):
            coordinates.append([i,j])
    cnv.place(x=500, y=0)
    computer_ship()
    print(coordinates)
    choose_ship()
    print()

def choose_ship():
    with_computer.place(x=-100, y=-50)
    settings.place(x=-100, y=-50)
    two_players.place(x=-300, y=-50)
    show_ship()
    ready.place(x=100, y=600)
    turn.place(x=100, y=700)
    back.place(x=300, y=700)
    for i in range(WIDTH):
        for j in range(HEIGHT):
            cnv.create_image(SQUARE_SIZE // 2 + i * SQUARE_SIZE,
                             SQUARE_SIZE // 2 + j * SQUARE_SIZE,
                             image=img[0])

def place_ship(x:int, y:int, t:int):
    global player
    global number
    number=y
    print(cells[3])
    if (player!= None):
        for j in range(player[3]-1):
            if player[4]==0:
                cnv.create_image(SQUARE_SIZE // 2 + player[1] * SQUARE_SIZE,
                         SQUARE_SIZE // 2 + (player[0] + j + 1) * SQUARE_SIZE,
                         image=img[1])
            elif player[4]==1:
                cnv.create_image(SQUARE_SIZE // 2 + (player[1]+j+1) * SQUARE_SIZE,
                                 SQUARE_SIZE // 2 + player[0]  * SQUARE_SIZE,
                                 image=img[1])
    player=[0, 0, cnv.create_image(SQUARE_SIZE // 2 + 0 * SQUARE_SIZE,
                            SQUARE_SIZE // 2 + 0 * SQUARE_SIZE,
                            image=img[1]), x, 0]
    for j in range(x-1):
        print(x-1)
        cells.append(cnv.create_image(SQUARE_SIZE // 2 + player[1] * SQUARE_SIZE,
                         SQUARE_SIZE // 2 + (player[0] + j + 1) * SQUARE_SIZE,
                         image=img[1]))

        #cnv.create_image(SQUARE_SIZE // 2 + 0 * SQUARE_SIZE,
                           #SQUARE_SIZE // 2 + j * SQUARE_SIZE,
                                               #  image=img[1])
    #player[2] = cnv.create_image(SQUARE_SIZE // 2 + player[1] * SQUARE_SIZE,
                                # SQUARE_SIZE // 2 + player[0] * SQUARE_SIZE,
                                 #image=img[1])
    print("Метод place_ship()")

def random_comp():
    r=random.randint(0, len(coordinates) - 1)
    s=random.randint(0, 1)
    return r,s

def error_coord(r:int):
    error_coordinates_comp.append(coordinates[r])
    if r%10>0:
        error_coordinates_comp.append(coordinates[r-1])
        if r>10:
            error_coordinates_comp.append(coordinates[r - 11])
        if r<90:
            error_coordinates_comp.append(coordinates[r + 9])
    if r%10<9:
        error_coordinates_comp.append(coordinates[r+1])
        if r > 10:
            error_coordinates_comp.append(coordinates[r - 9])
        if r < 90:
            error_coordinates_comp.append(coordinates[r + 11])
    if r>10:
        error_coordinates_comp.append(coordinates[r-10])
    if r<90:
        error_coordinates_comp.append(coordinates[r+10])

def check(r, s, c):
    result=0
    for i in range(c):
        if (s==0):
            if coordinates[r+i] in error_coordinates_comp:
                result=1
                break
        if (s==1):
            if coordinates[r-i] in error_coordinates_comp:
                result=1
                break
        if (s==2):
            if coordinates[r+(10*i)] in error_coordinates_comp:
                result=1
                break
        if (s==3):
            if coordinates[r-(10*i)] in error_coordinates_comp:
                result=1
                break
    return result

def computer_ship():
    r, s = random_comp()
    for j in range(4):
        if (s == 0 and r % 10 <7):
            computer_coordinates.append(coordinates[r  + j])
            error_coord(r + j)
        elif (s == 0 and r % 10 > 6):
            computer_coordinates.append(coordinates[r  - j])
            error_coord(r - j)
        elif (r < 70 and s == 1):
            computer_coordinates.append(coordinates[r + 10 * (j )])
            error_coord(r + 10 * (j))
        elif (r > 70 and s == 1):
            computer_coordinates.append(coordinates[r - 10 * (j)])
            error_coord(r - 10 * (j))
    r, s = random_comp()
    for i in range(2):
        if (s == 0 and r % 10 <8):
            c=check(r,0,3)
        elif (s == 0 and r % 10 > 7):
            c=check(r, 1, 3)
        elif (r <80 and s == 1):
            c=check(r, 2, 3)
        elif (r > 80 and s == 1):
            c=check(r, 3, 3)
        while (c==1):
            r, s = random_comp()
            if (s == 0 and r % 10 < 8):
                c = check(r, 0, 3)
            elif (s == 0 and r % 10 > 7):
                c = check(r, 1, 3)
            elif (r < 80 and s == 1):
                c = check(r, 2, 3)
            elif (r > 80 and s == 1):
                c = check(r, 3, 3)
        for j in range(3):
            if (s == 0 and r % 10 < 8):
                computer_coordinates.append(coordinates[r  + j])
                error_coord(r + j)
            elif (s == 0 and r % 10 > 7):
                computer_coordinates.append(coordinates[r - j])
                error_coord(r - j)
            elif (r < 80 and s == 1):
                computer_coordinates.append(coordinates[r + 10 * (j)])
                error_coord(r + 10 * (j))
            elif (r > 80 and s == 1):
                computer_coordinates.append(coordinates[r - 10 * (j)])
                error_coord(r - 10 * (j))
    r, s=random_comp()
    for i in range(3):
        if (s == 0 and r % 10 <9):
            c=check(r,0,2)
        elif (s == 0 and r % 10 > 8):
            c=check(r, 1, 2)
        elif (r <90 and s == 1):
            c=check(r, 2, 2)
        elif (r > 90 and s == 1):
            c=check(r, 3, 2)
        while (c==1):
            r, s = random_comp()
            if (s == 0 and r % 10 < 9):
                c = check(r, 0, 2)
            elif (s == 0 and r % 10 > 8):
                c = check(r, 1, 2)
            elif (r < 90 and s == 1):
                c = check(r, 2, 2)
            elif (r > 90 and s == 1):
                c = check(r, 3, 2)
        for j in range(2):
            if (s == 0 and r % 10 < 9):
                computer_coordinates.append(coordinates[r  + j])
                error_coord(r +j)
            elif (s == 0 and r % 10 > 8):
                computer_coordinates.append(coordinates[r  - j])
                error_coord(r - j)
            elif (r < 80 and s == 1):
                computer_coordinates.append(coordinates[r + 10 * (j )])
                error_coord(r + 10 * (j))
            elif (r > 80 and s == 1):
                computer_coordinates.append(coordinates[r - 10 * (j)])
                error_coord(r- 10 * (j))
    for i in range(4):
        while (coordinates[r] in error_coordinates_comp):
            r, s = random_comp()
        computer_coordinates.append(coordinates[r])
        error_coord(r)
    print("Координаты компьютера:", computer_coordinates)

def play():
    play_place()

def play_place():
    print("Координаты игрока:", coordinates_player1)
    cnv.delete(ALL)
    hide_ship()
    cnv.place(x=0, y=0)
    back.place(x=625, y=650)
    for i in range(WIDTH):
        for j in range(HEIGHT):
            cnv.create_image(SQUARE_SIZE // 2 + i * SQUARE_SIZE ,
                             SQUARE_SIZE // 2 + j * SQUARE_SIZE ,anchor='center',
                             image=img[0])
            cnv.create_image(SQUARE_SIZE // 2 + (i+12) * SQUARE_SIZE ,
                             SQUARE_SIZE // 2 + j * SQUARE_SIZE,anchor='center',
                             image=img[0])
            rect_id = cnv.create_rectangle(i * SQUARE_SIZE, j * SQUARE_SIZE,
                                           (i + 1) * SQUARE_SIZE, (j + 1) * SQUARE_SIZE,
                                           fill='', outline='')
            cnv.tag_bind(rect_id, "<Button-1>", on_click)
    cnv.create_text(WIDTH * SQUARE_SIZE * 0.5,
                    650,
                    fill="#000000",
                    text=f"Поле 1 игрока",
                    font="Verdana,55")
    cnv.create_text(WIDTH * SQUARE_SIZE * 1.75,
                    650,
                    fill="#000000",
                    text=f"Поле компьютера",
                    font="Verdana,55")

def turn_ship():
    global player
    if player[4]==0:
        player[4]=1
        print("Player[4]:", player[4])
    else:
        player[4]=0
        print("Player[4]:", player[4])

def on_click(event):
    global win_1
    x = event.x
    y = event.y
    row = int(y / (SQUARE_SIZE ))
    col = int(x / (SQUARE_SIZE ))
    if [col, row] in computer_coordinates:
        print(f"Пользователь кликнул на клетку ({col}, {row})")
        cnv.create_image(SQUARE_SIZE // 2 + col * SQUARE_SIZE ,
                          SQUARE_SIZE // 2 + row * SQUARE_SIZE ,
                          image=img[1])
        win_1+=1
        if (win_1==20):
            player_win()
    elif [col, row] not in computer_coordinates:
        cnv.create_image(SQUARE_SIZE // 2 + col * SQUARE_SIZE,
                         SQUARE_SIZE // 2 + row * SQUARE_SIZE,
                         image=img[4])
        print(f"Пользователь кликнул на клетку ({col}, {row})")
        computer_move()

def player_win():
    global win_1, win_2
    win_1=0
    win_2=0
    cnv.delete(ALL)
    cnv.create_text(WIDTH * SQUARE_SIZE,
                    400,
                    fill="#000000",
                    text=f"Вы победили! Поздравляем!",
                    font="Verdana,55")
    back.place(x=500, y=450)
    turn.place(x=-100, y=-50)

def computer_win():
    global win_1, win_2
    win_1=0
    win_2=0
    cnv.delete(ALL)
    cnv.create_text(WIDTH * SQUARE_SIZE,
                    400,
                    fill="#000000",
                    text=f"Вы проиграли! Поздравляем!",
                    font="Verdana,55")
    back.place(x=500, y=450)
    turn.place(x=-100, y=-50)

def computer_move():
    global win_2
    r=random.randint(1, len(coordinates)-1)
    print("Ход компьютера:", coordinates[r])
    while True:
        r = random.randint(0, len(coordinates) - 1)
        coord = coordinates[r]

        # Проверяем, занят ли эта клетка игроком
        if coord not in coordinates_player1:
            cnv.create_image(SQUARE_SIZE // 2 + (coordinates[r][0] + 12) * SQUARE_SIZE,
                             SQUARE_SIZE // 2 + (coordinates[r][1]) * SQUARE_SIZE,
                             image=img[4])
            break
        win_2+=1
        cnv.create_image(SQUARE_SIZE // 2 + (coordinates[r][0]+12) * SQUARE_SIZE,
                         SQUARE_SIZE // 2 + (coordinates[r][1]) * SQUARE_SIZE,
                         image=img[1])
        if win_2==20:
            computer_win()
    coordinates.remove(coord)

def two_player():
    for i in range(10):
        for j in range(10):
            coordinates.append([i,j])
    cnv.place(x=500, y=0)
    ready2.place(x=100, y=600)
    choose_ship()

def second_player():
    for i in range(20):
        coordinates_player2[i]=coordinates_player1[i]
        coordinates_player2[i][0] = coordinates_player2[i][0] + 12
    for i in range(10):
        for j in range(10):
            coordinates.append([i,j])
    cnv.place(x=500, y=0)
    ready3.place(x=100, y=600)
    ready.place(x=-100, y=-600)
    choose_ship()

def play2_place():
    print("Координаты игрока 1:", coordinates_player1)
    print("Координаты игрока 2:", coordinates_player2)
    cnv.delete(ALL)
    hide_ship()
    back.place(x=625, y=650)
    cnv.place(x=0, y=0)

    for i in range(WIDTH):
        for j in range(HEIGHT):
            cnv.create_image(SQUARE_SIZE // 2 + i * SQUARE_SIZE ,
                             SQUARE_SIZE // 2 + j * SQUARE_SIZE ,anchor='center',
                             image=img[0])
            cnv.create_image(SQUARE_SIZE // 2 + (i+12) * SQUARE_SIZE ,
                             SQUARE_SIZE // 2 + j * SQUARE_SIZE,anchor='center',
                             image=img[0])
            rect_id = cnv.create_rectangle(i * SQUARE_SIZE, j * SQUARE_SIZE,
                                           (i + 1) * SQUARE_SIZE, (j + 1) * SQUARE_SIZE,
                                           fill='', outline='')
            rect_id2 = cnv.create_rectangle((i+12) * SQUARE_SIZE, j * SQUARE_SIZE,
                                           (i + 13) * SQUARE_SIZE, (j + 1) * SQUARE_SIZE,
                                           fill='', outline='')
            cnv.tag_bind(rect_id, "<Button-1>", on_click2)
            cnv.tag_bind(rect_id2, "<Button-1>", on_click2)
    cnv.create_text(WIDTH * SQUARE_SIZE*0.5,
                    650,
                    fill="#000000",
                    text=f"Поле 1 игрока",
                    font="Verdana,55")
    cnv.create_text(WIDTH * SQUARE_SIZE * 1.75,
                    650,
                    fill="#000000",
                    text=f"Поле 2 игрока",
                    font="Verdana,55")

def on_click2(event):
    global win_1, win_2
    x = event.x
    y = event.y
    row = int(y / (SQUARE_SIZE ))
    col = int(x / (SQUARE_SIZE ))
    if [col, row] in coordinates_player2:
        print(f"Пользователь кликнул на клетку ({col}, {row})")
        cnv.create_image(SQUARE_SIZE // 2 + col * SQUARE_SIZE ,
                          SQUARE_SIZE // 2 + row * SQUARE_SIZE ,
                          image=img[1])
        win_1+=1
        if (win_1==20):
            player1_win()
    if [col, row] in coordinates_player1:
        print(f"Пользователь кликнул на клетку ({col}, {row})")
        cnv.create_image(SQUARE_SIZE // 2 + col * SQUARE_SIZE ,
                          SQUARE_SIZE // 2 + row * SQUARE_SIZE ,
                          image=img[1])
        win_2+=1
        if (win_2==20):
            player2_win()
    elif [col, row] not in coordinates_player2:
        cnv.create_image(SQUARE_SIZE // 2 + col * SQUARE_SIZE,
                         SQUARE_SIZE // 2 + row * SQUARE_SIZE,
                         image=img[4])
        print(f"Пользователь кликнул на клетку ({col}, {row})")

def player1_win():
    global win_1, win_2
    win_1=0
    win_2=0
    cnv.delete(ALL)
    cnv.create_text(WIDTH * SQUARE_SIZE,
                    400,
                    fill="#000000",
                    text=f"Победил игрок 2! Поздравляем!",
                    font="Verdana,55")
    back.place(x=500, y=450)
    turn.place(x=-100, y=-50)

def player2_win():
    global win_1, win_2
    win_1 = 0
    win_2 = 0
    cnv.delete(ALL)
    cnv.create_text(WIDTH * SQUARE_SIZE ,
                    400,
                    fill="#000000",
                    text=f"Победил игрок 1! Поздравляем!",
                    font="Verdana,55")
    back.place(x=500, y=450)
    turn.place(x=-100, y=-50)

def check_ready():
    global ships
    print ("Ships:",ships)
    if(ships==10):
        ships=0
        play()

def check_ready2():
    global ships
    print("Ships:",ships)
    if(ships==10):
        ships=0
        second_player()

def check_ready3():
    global ships
    print("Ships:",ships)
    if(ships==10):
        ships=0
        play2_place()

def setting():
    settings1.place(x=500, y=50)
    settings2.place(x=500, y=150)
    settings3.place(x=500, y=250)
    with_computer.place(x=-100, y=-50)
    two_players.place(x=-100, y=-50)
    settings.place(x=-100, y=-50)
    back.place(x=500, y=350)
    cnv.delete(ALL)
    print()

def setting1():
    root.geometry('160x900')

def setting2():
    root.geometry('1680x1050')

def setting3():
    root.geometry('1920x1080')

def back1():
    cnv.delete(ALL)
    hide_ship()
    turn.place(x=-500, y=-50)
    ready.place(x=-500, y=-50)
    ready2.place(x=-500, y=-350)
    ready3.place(x=-500, y=-650)
    settings1.place(x=-500, y=-50)
    settings2.place(x=-500, y=-350)
    settings3.place(x=-500, y=-650)
    with_computer.place(x=500, y=150)
    two_players.place(x=500, y=250)
    settings.place(x=500, y=350)
    back.place(x=-500, y=-650)

def movePlayerTo(x,y,count):
    global moving
    count-=1
    cnv.move(player[2],x,y)
    cnv.move(cells[0], x, y)
    cnv.move(cells[1], x, y)
    cnv.move(cells[2], x, y)

    if(count>0):
        moving=True
        root.after(20,
                   lambda x=x,
                          y=y,
                          c=count:
                   movePlayerTo(x,y,c))
    else:
        coordinates_player1[number]=[player[1], player[0]]
        if (player[4]==0):
            for i in range(player[3]):
                coordinates_player1[number+i] = [player[1], player[0]+i]
        else:
            for i in range(player[3]):
                coordinates_player1[number+i] = [player[1]+i, player[0]]

        #print("Метод movePlayerTo() выполнился")
        #print(coordinates_player1)
        moving=False

def move(v):
    #print("Метод move()")
    if(moving):
        return 0
    cnv.delete(player[2])
 
    for i in range(len(cells)):
        cnv.delete(cells[i])
    if player[4]==0:
        for i in range(player[3]-1):
            cells[i]=cnv.create_image(SQUARE_SIZE // 2 + player[1] * SQUARE_SIZE,
                         SQUARE_SIZE // 2 + (player[0] +i+1) * SQUARE_SIZE,
                         image=img[1])
    if player[4]==1:
        for i in range(player[3]-1):
            cells[i]=cnv.create_image(SQUARE_SIZE // 2 + (player[1]+i+1) * SQUARE_SIZE,
                         SQUARE_SIZE // 2 + player[0]  * SQUARE_SIZE,
                         image=img[1])
    player[2] = cnv.create_image(SQUARE_SIZE // 2 + player[1] * SQUARE_SIZE,
                                 SQUARE_SIZE // 2 + player[0] * SQUARE_SIZE,
                                 image=img[1])
    x=player[0]
    y=player[1]
    #Вверх
    if(v==UPKEY):
        if (player[0]!=0):
            movePlayerTo(0,-8,8)
            player[0]-=1
    #Вниз
    elif(v==DOWNKEY):
        if(player[0]!=9):
            movePlayerTo(0,8,8)
            player[0]+=1
    #Влево
    elif(v==LEFTKEY):
        if(player[1]!=0):
            movePlayerTo(-8,0,8)
            player[1]-=1
    #Вправо
    elif(v==RIGHTKEY):
        if(player[1]!=9):
            movePlayerTo(8,0,8)
            player[1]+=1

moving=False
number=-1
coordinates_player1=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
coordinates_player2=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
error_coordinates_comp=[]
img=[]
cells=[0,0,0,0]

img.append(PhotoImage(file="клетка.png"))
img.append(PhotoImage(file="зелёнаяклетка.png"))
img.append(PhotoImage(file="4клетки.png"))
img.append(PhotoImage(file="клеткамини.png"))
img.append(PhotoImage(file="серый.png"))

WIDTH=10
HEIGHT=10
SQUARE_SIZE=64
UPKEY=0
DOWNKEY=1
LEFTKEY=2
RIGHTKEY=3

ships=0
win_1=0
win_2=0

cnv=Canvas(root, width=WIDTH*SQUARE_SIZE*10, height=HEIGHT*SQUARE_SIZE*10,bg="#FFFFFF")
cnv.config(highlightthickness=0)
cnv.place(x=-5000,y=0)
cnv.focus_set()
cnv.bind("<Up>", lambda e, x=UPKEY:move(x))
cnv.bind("<Down>", lambda e, x=DOWNKEY:move(x))
cnv.bind("<Left>", lambda e, x=LEFTKEY:move(x))
cnv.bind("<Right>", lambda e, x=RIGHTKEY:move(x))

coordinates=[]
computer_coordinates=[]
player=[0,0,0,0,0]

ready= Button(root,text="Готово",font=",20",width=20)
ready.place(x=-100, y=-50)
ready["command"]=check_ready

ready2= Button(root,text="Готово",font=",20",width=20)
ready2.place(x=-100, y=-50)
ready2["command"]=check_ready2

ready3= Button(root,text="Готово",font=",20",width=20)
ready3.place(x=-100, y=-50)
ready3["command"]=check_ready3

with_computer= Button(root,text="Играть с компьютером",font=",20",width=20)
with_computer.place(x=500, y=150)
with_computer["command"]=computer

two_players= Button(root,text="2 Игрока",font=",40",width=20)
two_players.place(x=500, y=250)
two_players["command"]=two_player

settings= Button(root,text="Настройки",font=",60",width=20)
settings.place(x=500, y=350)
settings["command"]=setting

turn= Button(root,text="Повернуть",font=",20",width=20)
turn.place(x=-100, y=-50)
turn["command"]=turn_ship

settings1= Button(root,text="160x900",font=",60",width=20)
settings1.place(x=-500, y=-50)
settings1["command"]=setting1

settings2= Button(root,text="1680x1050",font=",60",width=20)
settings2.place(x=-500, y=-50)
settings2["command"]=setting2

settings3= Button(root,text="1920x1080",font=",60",width=20)
settings3.place(x=-500, y=-50)
settings3["command"]=setting3

back= Button(root,text="В меню",font=",60",width=20)
back.place(x=-500, y=-50)
back["command"]=back1

root.geometry('1920x1080')

ship_image4 = PhotoImage(file="корабль4.png")
ship_image3 = PhotoImage(file="корабль3.png")
ship_image2 = PhotoImage(file="корабль2.png")
ship_image1 = PhotoImage(file="корабль1.png")

ship1=Canvas(root, width=100, height=100)
ship1.create_image(10, 10, anchor=NW, image=ship_image4)
ship2=Canvas(root, width=100, height=100)
ship2.create_image(10, 10, anchor=NW, image=ship_image3)
ship3=Canvas(root, width=100, height=100)
ship3.create_image(10, 10, anchor=NW, image=ship_image2)
ship4=Canvas(root, width=100, height=100)
ship4.create_image(10, 10, anchor=NW, image=ship_image1)
ship22=Canvas(root, width=100, height=100)
ship22.create_image(10, 10, anchor=NW, image=ship_image3)
ship32=Canvas(root, width=100, height=100)
ship32.create_image(10, 10, anchor=NW, image=ship_image2)
ship33=Canvas(root, width=100, height=100)
ship33.create_image(10, 10, anchor=NW, image=ship_image2)
ship42=Canvas(root, width=100, height=100)
ship42.create_image(10, 10, anchor=NW, image=ship_image1)
ship43=Canvas(root, width=100, height=100)
ship43.create_image(10, 10, anchor=NW, image=ship_image1)
ship44=Canvas(root, width=100, height=100)
ship44.create_image(10, 10, anchor=NW, image=ship_image1)

ship1.bind("<ButtonPress-1>", lambda event: (place_ship(4,0,0), hide_ship1()))
ship2.bind("<ButtonPress-1>", lambda event: (place_ship(3,4,0), hide_ship2()))
ship3.bind("<ButtonPress-1>", lambda event: (place_ship(2,7,0),hide_ship4()))
ship4.bind("<ButtonPress-1>", lambda event: (place_ship(1,9,0), hide_ship7()))
ship22.bind("<ButtonPress-1>", lambda event: (place_ship(3,10,0),hide_ship3()))
ship32.bind("<ButtonPress-1>", lambda event: (place_ship(2,13,0),hide_ship5()))
ship33.bind("<ButtonPress-1>", lambda event: (place_ship(2,15,0), hide_ship6()))
ship42.bind("<ButtonPress-1>", lambda event:(place_ship(1,17,0), hide_ship8()))
ship43.bind("<ButtonPress-1>", lambda event: (place_ship(1,18,0), hide_ship9()))
ship44.bind("<ButtonPress-1>", lambda event: (place_ship(1,19,0), hide_ship10()))

field=Canvas(root, width=1200, height=1200)
field.create_image(10, 10, anchor=NW, image=img[0])
root.mainloop()