
def KuludTulud(failinimi):

    fail = open(failinimi, encoding = "UTF-8")

    raha = []

    for rida in fail:

        rida = rida.strip().split(",")

        raha.append(rida[8])

    raha.remove(raha[0])

    for i in range(len(raha)):
        raha[i] = float(raha[i])

    kulud = []
    tulud = []

    for arv in raha:
        if arv < 0:
            kulud.append(arv)
        else:
            tulud.append(arv)


    return f"Tulusid oli {round(sum(tulud),2)} € ja kulusid {round(sum(kulud),2)} €. Kahe kuu konto saldo on {round(sum(raha),2)} eurot."
            