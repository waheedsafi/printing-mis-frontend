import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useModelOnRequestHide } from "@/components/custom-ui/model/hook/useModelOnRequestHide";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import ButtonSpinner from "@/components/custom-ui/spinner/ButtonSpinner";
import { useEffect, useState } from "react";
import PrimaryButton from "@/components/custom-ui/button/PrimaryButton";
import CustomInput from "@/components/custom-ui/input/CustomInput";
import axiosClient from "@/lib/axois-client";
import { toast } from "@/components/ui/use-toast";
import { setServerError, validate } from "@/validation/validation";
import { SimpleItem } from "@/database/tables";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Shimmer from "@/components/custom-ui/shimmer/Shimmer";
import CustomCheckbox from "@/components/custom-ui/checkbox/CustomCheckbox";
import NetworkSvg from "@/components/custom-ui/image/NetworkSvg";

export interface ExpenseTypeDialogProps {
  onComplete: (expenseType: SimpleItem, edited: boolean) => void;
  expenseType?: SimpleItem;
}
export default function ExpenseTypeDialog(props: ExpenseTypeDialogProps) {
  const { onComplete, expenseType } = props;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [error, setError] = useState(new Map<string, string>());
  const [userData, setUserData] = useState<{
    id: string;
    farsi: string;
    english: string;
    pashto: string;
    icons: {
      id: string;
      name: string;
      path: string;
      selected: any;
    }[];
  }>({
    id: "",
    farsi: "",
    english: "",
    pashto: "",
    icons: [],
  });
  const { modelOnRequestHide } = useModelOnRequestHide();
  const { t } = useTranslation();
  const fetch = async () => {
    try {
      setFetching(true);
      const response = await axiosClient.get(
        `expense-types/${expenseType?.id}`
      );
      if (response.status === 200) {
        setUserData(response.data.expense_type);
      }
    } catch (error: any) {
      console.log(error);
    }
    setFetching(false);
  };
  const fetchIcons = async () => {
    try {
      setFetching(true);
      const response = await axiosClient.get(`icons-names`);
      if (response.status === 200) {
        const data = response.data;
        setUserData({ ...userData, icons: data });
      }
    } catch (error: any) {
      console.log(error);
    }
    setFetching(false);
  };
  useEffect(() => {
    if (expenseType) fetch();
    else {
      fetchIcons();
    }
  }, []);
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };
  const storeOrUpdate = async () => {
    if (loading) return;
    setLoading(true);
    const selectedIcons: any = [];
    const passed = await validate(
      [
        { name: "english", rules: ["required"] },
        { name: "farsi", rules: ["required"] },
        { name: "pashto", rules: ["required"] },
        {
          name: "icons",
          rules: [
            (userData: any) => {
              for (const item of userData.icons) {
                if (item.selected) {
                  selectedIcons.push(item);
                }
              }
              if (selectedIcons.length == 0) {
                toast({
                  toastType: "ERROR",
                  description: t("atleast_one_ico"),
                });
                return true;
              } else {
                return false;
              }
            },
          ],
        },
      ],
      userData,
      setError
    );
    if (!passed) {
      setLoading(false);
      return;
    }

    try {
      const form = {
        id: expenseType?.id,
        english: userData.english,
        farsi: userData.farsi,
        pashto: userData.pashto,
        icons: selectedIcons,
      };

      const response = expenseType
        ? await axiosClient.put("/expense-types", {
            ...form,
          })
        : await axiosClient.post("/expense-types", {
            ...form,
          });
      if (response.status === 200) {
        toast({ toastType: "SUCCESS", description: response.data.message });
        onComplete(response.data.expense_type, expenseType ? true : false);
        modelOnRequestHide();
      }
    } catch (error: any) {
      setServerError(error.response?.data?.errors, setError);
      toast({ toastType: "ERROR", description: error.response?.data?.message });
    } finally {
      setLoading(false);
    }
  };

  const iconOnSelect = (value: boolean, id: string) => {
    setUserData((prev) => ({
      ...prev,
      icons: prev.icons.map((item) =>
        item.id == id ? { ...item, selected: value } : item
      ),
    }));
  };
  return (
    <Card className="w-fit my-8 min-w-[400px] self-center [backdrop-filter:blur(20px)] bg-white/70 dark:!bg-black/40">
      <CardHeader className="relative text-start">
        <CardTitle className="rtl:text-4xl-rtl ltr:text-3xl-ltr text-tertiary">
          {expenseType ? t("edit") : t("add")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CustomInput
          size_="sm"
          dir="ltr"
          loading={fetching}
          className="rtl:text-end"
          required={true}
          requiredHint={`* ${t("required")}`}
          placeholder={t("translate_en")}
          defaultValue={userData.english}
          type="text"
          name="english"
          errorMessage={error.get("english")}
          onChange={handleChange}
          startContentDark={true}
          startContent={
            <h1 className="font-bold text-primary-foreground text-[11px] mx-auto">
              {t("en")}
            </h1>
          }
        />
        <CustomInput
          size_="sm"
          required={true}
          requiredHint={`* ${t("required")}`}
          placeholder={t("translate_fa")}
          defaultValue={userData.farsi}
          type="text"
          loading={fetching}
          name="farsi"
          errorMessage={error.get("farsi")}
          onChange={handleChange}
          startContentDark={true}
          startContent={
            <h1 className="font-bold text-primary-foreground text-[11px] mx-auto">
              {t("fa")}
            </h1>
          }
        />
        <CustomInput
          size_="sm"
          loading={fetching}
          required={true}
          requiredHint={`* ${t("required")}`}
          placeholder={t("translate_ps")}
          defaultValue={userData.pashto}
          type="text"
          name="pashto"
          errorMessage={error.get("pashto")}
          onChange={handleChange}
          startContentDark={true}
          startContent={
            <h1 className="font-bold text-primary-foreground text-[11px] mx-auto">
              {t("ps")}
            </h1>
          }
        />
        <Table className="bg-card rounded-md mt-3 py-8 w-full">
          <TableHeader className="rtl:text-3xl-rtl ltr:text-xl-ltr">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-start">{t("name")}</TableHead>
              <TableHead className="text-start">{t("picture")}</TableHead>
              <TableHead className="text-start">{t("action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="rtl:text-xl-rtl ltr:text-lg-ltr">
            {fetching ? (
              <TableRow>
                <TableCell>
                  <Shimmer className="h-[24px] w-full rounded-sm" />
                </TableCell>
                <TableCell>
                  <Shimmer className="h-[24px] w-full rounded-sm" />
                </TableCell>
                <TableCell>
                  <Shimmer className="h-[24px] w-full rounded-sm" />
                </TableCell>
              </TableRow>
            ) : (
              userData.icons.map((icon, index: number) => (
                <TableRow key={index}>
                  <TableCell className="text-start">{icon.name}</TableCell>
                  <TableCell>
                    <NetworkSvg
                      className="[&>svg]:size-[18px]"
                      src={icon?.path}
                      routeIdentifier={"public"}
                    />
                  </TableCell>

                  <TableCell>
                    <CustomCheckbox
                      checked={
                        icon.selected == 1 || icon.selected == true
                          ? true
                          : false
                      }
                      onCheckedChange={(value: boolean) =>
                        iconOnSelect(value, icon.id)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          className="rtl:text-xl-rtl ltr:text-lg-ltr"
          variant="outline"
          onClick={modelOnRequestHide}
        >
          {t("cancel")}
        </Button>
        <PrimaryButton
          disabled={loading}
          onClick={storeOrUpdate}
          className={`${loading && "opacity-90"}`}
          type="submit"
        >
          <ButtonSpinner loading={loading}>{t("save")}</ButtonSpinner>
        </PrimaryButton>
      </CardFooter>
    </Card>
  );
}
