'use client'

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"

const formSchema = z.object({
  username: z.string().min(2, "名前は2文字以上で入力してください").max(50, "名前は50文字以内で入力してください"),
  age: z.number({ invalid_type_error: "年齢は数値で入力してください" }).min(18, "18歳以上のみ").max(60, "60歳以下のみ"),
  yearsOfExperience: z.number({ invalid_type_error: "経験年数は数値で入力してください" }).min(1, "経験年数は1年以上が必要です"),
  skills: z
    .array(z.object({ name: z.string().min(1, "スキル名は必須です") }))
    .min(1, "最低1つのスキルを入力してください"),
  annualSalary: z.number({ invalid_type_error: "年収は数値で入力してください" }).optional(),
  purpose: z.string().optional(),
})

export function HomeTemplate() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      age: undefined,
      yearsOfExperience: undefined,
      skills: [{ name: "" }],
      annualSalary: undefined,
      purpose: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const { data: formData, error: formError } = await supabase
        .from('form_submissions')
        .insert([{
          username: data.username,
          age: data.age,
          years_of_experience: data.yearsOfExperience,
          annual_salary: data.annualSalary,
          purpose: data.purpose
        }])
        .select()

      if (formError || !formData || formData.length === 0) {
        console.error("❌ form_submissions error:", formError?.message)
        alert("データ保存に失敗しました（基本情報）")
        return
      }

      const formId = formData[0].id

      const skillInserts = data.skills.map(skill => ({
        form_id: formId,
        name: skill.name
      }))

      const { error: skillsError } = await supabase
        .from('skills')
        .insert(skillInserts)

      if (skillsError) {
        console.error("❌ skills error:", skillsError.message)
        alert("データ保存に失敗しました（スキル）")
        return
      }

      alert("キャリアマップ作成成功しました（beta）")

    } catch (e) {
      console.error("❌ 予期せぬエラー:", e)
      alert("予期せぬエラーが発生しました")
    }
  }

  return (
    <div>
      <div className="w-full max-w-[1080px] mx-auto my-12">
        <div className="flex align-center justify-center flex-col text-center">
          <h1 className="text-2xl font-bold">guputo_kun</h1>
          <h2 className="text-sm">キャリアマインドマップ自動生成システム</h2>
        </div>

        <div className="flex align-middle justify-center mt-4">
          <Avatar>
            <AvatarImage src="/guputo-kun.jpg" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl mx-auto p-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名前<span className="text-red-600 font-bold">必須</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>年齢<span className="text-red-600 font-bold">必須</span></FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          field.onChange(val === "" ? undefined : Number(val));
                        }
                      }}
                      pattern="[0-9]*"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yearsOfExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>経験<span className="text-red-600 font-bold">必須</span></FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          field.onChange(val === "" ? undefined : Number(val));
                        }
                      }}
                      pattern="[0-9]*"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Skills */}
            <FormField
  control={form.control}
  name="skills"
  render={() => (
    <FormItem>
      <FormLabel>スキル<span className="text-red-600 font-bold">必須</span></FormLabel>

      <div className="space-y-2 mt-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name={`skills.${index}.name`}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input {...field} placeholder={`Skill #${index + 1}`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="destructive" onClick={() => remove(index)}>
              削除
            </Button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={() => append({ name: "" })} className="mt-2">
        + 追加
      </Button>

      {/* 配列自体のエラーメッセージ（skills[]が空） */}
      {form.formState.errors.skills && typeof form.formState.errors.skills.message === 'string' && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.skills.message}
        </p>
      )}
    </FormItem>
  )}
/>

            <FormField
              control={form.control}
              name="annualSalary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>年収</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^\d*$/.test(val)) {
                          field.onChange(val === "" ? undefined : Number(val));
                        }
                      }}
                      pattern="[0-9]*"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>目的</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="work_life_balance">ワークライフバランス</SelectItem>
                      <SelectItem value="earn_more">稼ぎたい</SelectItem>
                      <SelectItem value="skill_up">スキルアップ</SelectItem>
                      <SelectItem value="management_track">上流工程に携わりたい</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              キャリアパスマップを作成する
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}