def KuludTulud(failinimi):

    fail = open(failinimi, encoding = "UTF-8")

    kulud = []
    tulud = []

    for rida in fail:

        rida = rida.strip().split(";")

        try:

            if rida[3] == '""':

                kulud.append(rida[8])

            else:
                tulud.append(rida[8])
        
        except IndexError:

            break

    kulud = kulud[1:-1]
    kulud = [float(num.replace(',', '.')) for num in kulud]
    tulud = tulud[1:-1]
    tulud = [float(num.replace(',', '.')) for num in tulud]

    return f"Tulusid oli {round(sum(tulud),2)} € ja kulusid -{round(sum(kulud),2)} €. Konto saldo on {round(sum(tulud) + sum(kulud),2)} eurot."
            
print(KuludTulud("SEB.csv"))
