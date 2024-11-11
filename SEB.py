def KuludTulud(kulude_fail, tulude_fail):

    fail_k = open(kulude_fail, encoding = "UTF-8")
    fail_t = open(tulude_fail, encoding="UTF-8")

    kulud = []
    tulud = []

    try:

        for rida in fail_k:

            rida = rida.strip().split(";")

            kulud.append(rida[8])

    except IndexError:
        exit

    kulud = kulud[1:]
    kulud = [float(num.replace('"', '').replace(',', '.'))* -1 for num in kulud]

    try:
        for rida in fail_t:

            rida = rida.strip().split(";")

            print(rida[8])

            tulud.append(rida[8])

    except IndexError:
        exit

    tulud = tulud[1:]
    tulud = [float(num.replace('"', '').replace(',', '.')) for num in tulud]

    return f"Tulusid oli {round(sum(tulud),2)} € ja kulusid {round(sum(kulud),2)} €. Konto saldo on {round(sum(tulud) + sum(kulud),2)} eurot."
